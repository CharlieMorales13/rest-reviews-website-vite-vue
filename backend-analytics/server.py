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
import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

from infrastructure.logging_config import setup_logging
from config import config

setup_logging(config.LOG_LEVEL)
logger = logging.getLogger("analytics.server")

app = FastAPI(title="Analytics Sentiment Service")

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def _require_api_key(api_key: str | None = Security(_api_key_header)) -> None:
    """Reject requests that don't carry the shared API key (when one is configured)."""
    expected = config.ANALYTICS_API_KEY
    if not expected:
        return  # key not configured → open (dev / local)
    if api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

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

    # Load model in background so the server accepts connections immediately.
    # /health will return model_loaded=false until it's ready.
    async def _preload():
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(None, _deps["model"].load)
            logger.info("Model pre-loaded in background")
        except Exception as e:
            logger.warning("Could not pre-load model: %s", e)

    asyncio.create_task(_preload())


# ── Request / Response models ─────────────────────────────────────────────

class PredictRequest(BaseModel):
    review_id: str
    text: str
    food_score: float | None = None
    service_score: float | None = None
    price_score: float | None = None


class TrainRequest(BaseModel):
    pass


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.post("/predict", dependencies=[Security(_require_api_key)])
async def predict(req: PredictRequest) -> dict:
    from application.use_cases.predict_single_review import PredictSingleReviewUseCase
    uc = PredictSingleReviewUseCase(_deps["model"], _deps["model_repo"], _deps["metrics_repo"])
    result = uc.execute(
        req.review_id, req.text,
        food_score=req.food_score,
        service_score=req.service_score,
        price_score=req.price_score,
    )
    return result


@app.post("/train", dependencies=[Security(_require_api_key)])
async def train(req: TrainRequest = TrainRequest()) -> dict:
    from infrastructure.ml.evaluation_dataset import TRAINING_DATA
    from domain.value_objects import IGEWeights
    from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
    from application.use_cases.run_pipeline import RunPipelineUseCase

    snapshots_uc = GenerateMetricsSnapshotsUseCase(
        _deps["review_repo"], _deps["metrics_repo"], _deps["model"], IGEWeights()
    )
    run_uc = RunPipelineUseCase(
        _deps["review_repo"], _deps["model"], _deps["model_repo"],
        _deps["metrics_repo"], snapshots_uc, TRAINING_DATA, config.MODEL_VERSION,
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
