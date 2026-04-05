"""
Analytics Pipeline — Entry Point (Composition Root)

Node.js invokes sentiment_model.py which delegates here.

Modes (dispatched via stdin JSON):
  - {"mode": "train"}                              → full pipeline (retrain + IGE snapshots)
  - {"mode": "predict", "review_id": X, "text": Y} → single-review inference, no retraining

Default (no stdin): full pipeline.
"""
import json
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infrastructure.logging_config import setup_logging
from config import config


def _build_deps():
    """Wire all concrete dependencies. Returns a namespace of instances."""
    from infrastructure.database.engine import get_engine
    from infrastructure.database.review_repository import SqlAlchemyReviewRepository
    from infrastructure.database.model_repository import SqlAlchemyModelRepository
    from infrastructure.database.metrics_repository import SqlAlchemyMetricsRepository
    from infrastructure.ml.sentiment_pipeline import SklearnSentimentPipeline

    engine = get_engine()
    return dict(
        review_repo=SqlAlchemyReviewRepository(engine),
        model_repo=SqlAlchemyModelRepository(engine),
        metrics_repo=SqlAlchemyMetricsRepository(engine),
        model=SklearnSentimentPipeline(config.MODEL_PATH),
    )


def run_train() -> dict:
    """Full pipeline: retrain model + classify all reviews + IGE snapshots."""
    from infrastructure.ml.training_data import TRAINING_DATA
    from domain.value_objects import IGEWeights
    from application.use_cases.evaluate_model import EvaluateModelUseCase
    from application.use_cases.train_model import TrainModelUseCase
    from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
    from application.use_cases.run_pipeline import RunPipelineUseCase

    deps = _build_deps()
    evaluate_uc = EvaluateModelUseCase(deps["model"], TRAINING_DATA)
    train_uc = TrainModelUseCase(
        deps["model"], deps["model_repo"], evaluate_uc,
        TRAINING_DATA, config.MODEL_VERSION,
    )
    snapshots_uc = GenerateMetricsSnapshotsUseCase(
        deps["review_repo"], deps["metrics_repo"], deps["model"], IGEWeights()
    )
    run_uc = RunPipelineUseCase(
        deps["review_repo"], deps["model"], train_uc,
        deps["metrics_repo"], snapshots_uc,
    )
    return run_uc.execute()


def run_predict(review_id: str, text: str) -> dict:
    """Single-review inference: load cached model, classify, persist."""
    from application.use_cases.predict_single_review import PredictSingleReviewUseCase

    deps = _build_deps()
    uc = PredictSingleReviewUseCase(
        deps["model"], deps["model_repo"], deps["metrics_repo"]
    )
    return uc.execute(review_id, text)


def _read_stdin_payload() -> dict:
    """Read JSON from stdin if available. Returns {} on error or empty stdin."""
    if sys.stdin.isatty():
        return {}
    try:
        raw = sys.stdin.read().strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def main() -> None:
    setup_logging(config.LOG_LEVEL)
    logger = logging.getLogger("analytics.main")

    payload = _read_stdin_payload()
    mode = payload.get("mode", "train")

    try:
        if mode == "predict":
            review_id = payload.get("review_id", "")
            text = payload.get("text", "")
            if not review_id or not text:
                raise ValueError("predict mode requires 'review_id' and 'text'")
            result = run_predict(review_id, text)
        else:
            result = run_train()

        print(json.dumps(result))

    except Exception as e:
        logger.critical("Pipeline crashed (mode=%s): %s", mode, e, exc_info=True)
        print(json.dumps({"error": "Pipeline analysis failed. Check server logs."}))
        sys.exit(1)


if __name__ == "__main__":
    main()
