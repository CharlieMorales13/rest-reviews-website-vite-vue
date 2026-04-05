"""
Analytics Pipeline — Entry Point (Composition Root)

Node.js (AnalyticsService.ts) invokes sentiment_model.py which delegates here.
This module wires all concrete dependencies and runs the pipeline.
"""
import json
import logging
import os
import sys

# Make domain/, application/, infrastructure/ importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infrastructure.logging_config import setup_logging
from config import config


def main() -> None:
    setup_logging(config.LOG_LEVEL)
    logger = logging.getLogger("analytics.main")

    try:
        from infrastructure.database.engine import get_engine
        from infrastructure.database.review_repository import SqlAlchemyReviewRepository
        from infrastructure.database.model_repository import SqlAlchemyModelRepository
        from infrastructure.database.metrics_repository import SqlAlchemyMetricsRepository
        from infrastructure.ml.sentiment_pipeline import SklearnSentimentPipeline
        from infrastructure.ml.training_data import TRAINING_DATA
        from domain.value_objects import IGEWeights
        from application.use_cases.evaluate_model import EvaluateModelUseCase
        from application.use_cases.train_model import TrainModelUseCase
        from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
        from application.use_cases.run_pipeline import RunPipelineUseCase
        from application.errors import AnalyticsError

        # Infrastructure
        engine = get_engine()
        review_repo = SqlAlchemyReviewRepository(engine)
        model_repo = SqlAlchemyModelRepository(engine)
        metrics_repo = SqlAlchemyMetricsRepository(engine)
        model = SklearnSentimentPipeline(config.MODEL_PATH)

        # Use cases (dependency injection)
        evaluate_uc = EvaluateModelUseCase(model, TRAINING_DATA)
        train_uc = TrainModelUseCase(
            model, model_repo, evaluate_uc, TRAINING_DATA, config.MODEL_VERSION
        )
        snapshots_uc = GenerateMetricsSnapshotsUseCase(
            review_repo, metrics_repo, model, IGEWeights()
        )
        run_uc = RunPipelineUseCase(review_repo, model, train_uc, metrics_repo, snapshots_uc)

        result = run_uc.execute()
        print(json.dumps(result))

    except Exception as e:
        # Bug Fix 5: never expose internal details to Node.js stdout
        logger.critical("Pipeline crashed: %s", e, exc_info=True)
        print(json.dumps({"error": "Pipeline analysis failed. Check server logs."}))
        sys.exit(1)


if __name__ == "__main__":
    main()
