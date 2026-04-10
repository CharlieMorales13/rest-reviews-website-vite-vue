"""
FastAPI inference server for the sentiment analytics pipeline.

Replaces the subprocess spawn-per-request pattern with a persistent HTTP service.
The model is loaded once at startup and reused for all requests.

Endpoints:
  POST /predict  — single-review inference (called on every POST /reviews)
  POST /train    — full pipeline: retrain + classify all + IGE snapshots (admin only)

Start with:
  uvicorn server:app --host 0.0.0.0 --port 8001
"""
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from infrastructure.logging_config import setup_logging
from config import config

setup_logging(config.LOG_LEVEL)
logger = logging.getLogger("analytics.server")

app = FastAPI(title="Analytics Sentiment Service")

# ── Dependency container — built once at startup ──────────────────────────
_deps: dict = {}


def _build_deps() -> dict:
    from infrastructure.database.engine import get_engine
    from infrastructure.database.review_repository import SqlAlchemyReviewRepository
    from infrastructure.database.model_repository import SqlAlchemyModelRepository
    from infrastructure.database.metrics_repository import SqlAlchemyMetricsRepository
    from infrastructure.ml.transformer_pipeline import TransformerSentimentPipeline

    engine = get_engine()
    model = TransformerSentimentPipeline(config.TRANSFORMER_MODEL_NAME)

    return dict(
        review_repo=SqlAlchemyReviewRepository(engine),
        model_repo=SqlAlchemyModelRepository(engine),
        metrics_repo=SqlAlchemyMetricsRepository(engine),
        model=model,
    )


@app.on_event("startup")
async def startup() -> None:
    global _deps
    logger.info("Starting analytics server — model=%s", config.TRANSFORMER_MODEL_NAME)
    _deps = _build_deps()

    # Pre-load model into memory so first request is fast
    try:
        _deps["model"].load_or_train([], [])
        logger.info("Model pre-loaded at startup")
    except Exception as e:
        logger.warning("Could not pre-load model at startup: %s", e)


# ── Request / Response models ─────────────────────────────────────────────

class PredictRequest(BaseModel):
    review_id: str
    text: str


class TrainRequest(BaseModel):
    force_retrain: bool = False


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.post("/predict")
async def predict(req: PredictRequest) -> dict:
    from application.use_cases.predict_single_review import PredictSingleReviewUseCase
    uc = PredictSingleReviewUseCase(_deps["model"], _deps["model_repo"], _deps["metrics_repo"])
    result = uc.execute(req.review_id, req.text)
    return result


@app.post("/train")
async def train(req: TrainRequest = TrainRequest()) -> dict:
    from infrastructure.ml.training_data import TRAINING_DATA
    from domain.value_objects import IGEWeights
    from application.use_cases.evaluate_model import EvaluateModelUseCase
    from application.use_cases.train_model import TrainModelUseCase
    from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
    from application.use_cases.run_pipeline import RunPipelineUseCase

    evaluate_uc = EvaluateModelUseCase(_deps["model"], TRAINING_DATA)
    train_uc = TrainModelUseCase(
        _deps["model"], _deps["model_repo"], evaluate_uc,
        TRAINING_DATA, config.MODEL_VERSION,
    )
    snapshots_uc = GenerateMetricsSnapshotsUseCase(
        _deps["review_repo"], _deps["metrics_repo"], _deps["model"], IGEWeights()
    )
    run_uc = RunPipelineUseCase(
        _deps["review_repo"], _deps["model"], train_uc,
        _deps["metrics_repo"], snapshots_uc,
    )
    try:
        result = run_uc.execute()
        return result
    except Exception as e:
        logger.error("Train pipeline failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "model_loaded": _deps.get("model") is not None and _deps["model"].is_loaded()}
