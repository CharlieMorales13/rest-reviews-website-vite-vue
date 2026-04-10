import logging
from collections import Counter

from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
from application.use_cases.train_model import TrainModelUseCase
from domain.interfaces import IMetricsRepository, IReviewRepository, ISentimentModel
from domain.services import IGECalculator

logger = logging.getLogger(__name__)


class RunPipelineUseCase:
    """Orchestrate the full end-to-end analytics pipeline."""

    def __init__(
        self,
        review_repo: IReviewRepository,
        model: ISentimentModel,
        train_use_case: TrainModelUseCase,
        metrics_repo: IMetricsRepository,
        snapshots_use_case: GenerateMetricsSnapshotsUseCase,
    ) -> None:
        self._review_repo = review_repo
        self._model = model
        self._train_use_case = train_use_case
        self._metrics_repo = metrics_repo
        self._snapshots_use_case = snapshots_use_case

    def execute(self) -> dict:
        """Run the pipeline and return the JSON contract dict.

        Output contract (stdout → Node.js — must not change):
            {"accuracy": float, "f1Score": float, "sentiment_label": str, "ige_global": float}
        """
        # 1. Extract all reviews
        df = self._review_repo.get_all_reviews()
        if df.empty:
            logger.warning("No reviews found — returning zero metrics")
            return {
                "accuracy": 0.0,
                "f1Score": 0.0,
                "sentiment_label": "neutral",
                "ige_global": 0.0,
            }

        logger.info("RunPipelineUseCase.execute — %d reviews loaded", len(df))

        # 2. Calculate global IGE
        ige_global = IGECalculator.calculate_global(df)
        logger.info("IGE global = %.2f", ige_global)

        # 3. Train / load model + persist metrics + training run lifecycle
        version_id, metrics = self._train_use_case.execute()

        # 4. Predict sentiments for all reviews
        comments = df["comment"].fillna("").tolist()
        predictions = self._model.predict(comments)

        # 5. Assign review IDs to predictions
        review_ids = df["id"].tolist()
        for pred, review_id in zip(predictions, review_ids):
            pred.review_id = str(review_id)

        # 6. Persist predictions in sentiment_results
        inserted = self._metrics_repo.save_predictions(predictions, version_id)
        logger.info("Predictions persisted — count=%d", inserted)

        # 7. Generate metrics_snapshots per establishment (Bug Fix 4)
        self._snapshots_use_case.execute()

        # 8. Determine overall sentiment_label as the majority label (batch mode)
        label_counts = Counter(p.label for p in predictions)
        sentiment_label = label_counts.most_common(1)[0][0]

        return {
            "accuracy": round(metrics.accuracy, 4),
            "f1Score": round(metrics.f1, 4),
            "sentiment_label": sentiment_label,
            "ige_global": round(ige_global, 2),
        }
