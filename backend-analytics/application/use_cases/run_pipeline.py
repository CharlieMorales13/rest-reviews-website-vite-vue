import logging
from collections import Counter
from typing import List, Tuple

from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
from domain.entities import ModelMetrics
from domain.interfaces import (
    IMetricsRepository,
    IModelRepository,
    IReviewRepository,
    ISentimentModel,
)
from domain.services import IGECalculator, SentimentReconciler

logger = logging.getLogger(__name__)


class RunPipelineUseCase:
    """Orchestrate the full end-to-end analytics pipeline."""

    def __init__(
        self,
        review_repo: IReviewRepository,
        model: ISentimentModel,
        model_repo: IModelRepository,
        metrics_repo: IMetricsRepository,
        snapshots_use_case: GenerateMetricsSnapshotsUseCase,
        training_data: List[Tuple[str, str]],
        version: str,
    ) -> None:
        self._review_repo = review_repo
        self._model = model
        self._model_repo = model_repo
        self._metrics_repo = metrics_repo
        self._snapshots_use_case = snapshots_use_case
        self._training_data = training_data
        self._version = version

    def _load_and_evaluate(self) -> tuple[str, ModelMetrics]:
        """Load pretrained model, evaluate against gold set, persist run lifecycle."""
        dataset_size = len(self._training_data)
        version_id = self._model_repo.get_or_create_model_version(self._version, dataset_size)
        run_id = self._model_repo.create_training_run(version_id)
        logger.info("Training run created — run_id=%s version=%s", run_id, self._version)

        try:
            self._model.load()
            texts = [t for t, _ in self._training_data]
            labels = [lbl for _, lbl in self._training_data]
            metrics = self._model.evaluate(texts, labels)
            self._model_repo.update_model_metrics(version_id, metrics)
            self._model_repo.finish_training_run(run_id, "success")
            logger.info(
                "Model evaluated — accuracy=%.4f f1=%.4f", metrics.accuracy, metrics.f1
            )
            return version_id, metrics
        except Exception as e:
            self._model_repo.finish_training_run(run_id, "failed", str(e))
            logger.error("Model load/evaluate failed — run_id=%s error=%s", run_id, e)
            raise RuntimeError(f"Model load/evaluate failed: {e}") from e

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

        # 3. Load model + evaluate + persist run lifecycle
        version_id, metrics = self._load_and_evaluate()

        # 4. Predict sentiments for all reviews
        comments = df["comment"].fillna("").tolist()
        predictions = self._model.predict(comments)

        # 5. Assign review IDs and reconcile with star-rating scores
        review_ids = df["id"].tolist()
        for pred, review_id, food, service, price in zip(
            predictions,
            review_ids,
            df["food_score"].tolist(),
            df["service_score"].tolist(),
            df["price_score"].tolist(),
        ):
            pred.review_id = str(review_id)
            final_label, final_prob = SentimentReconciler.reconcile(
                pred.label, pred.probability, food, service, price
            )
            pred.label = final_label
            pred.probability = final_prob

        # 6. Persist predictions in sentiment_results
        inserted = self._metrics_repo.save_predictions(predictions, version_id)
        logger.info("Predictions persisted — count=%d", inserted)

        # 7. Generate metrics_snapshots per establishment
        self._snapshots_use_case.execute()

        # 8. Determine overall sentiment_label as the majority label
        label_counts = Counter(p.label for p in predictions)
        sentiment_label = label_counts.most_common(1)[0][0]

        return {
            "accuracy": round(metrics.accuracy, 4),
            "f1Score": round(metrics.f1, 4),
            "sentiment_label": sentiment_label,
            "ige_global": round(ige_global, 2),
        }
