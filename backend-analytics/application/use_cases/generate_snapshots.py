import datetime
import logging

from application.use_cases.extract_negative_terms import ExtractNegativeTermsUseCase
from domain.entities import MetricsSnapshot
from domain.interfaces import IMetricsRepository, IReviewRepository, ISentimentModel
from domain.services import IGECalculator
from domain.value_objects import IGEWeights

logger = logging.getLogger(__name__)


class GenerateMetricsSnapshotsUseCase:
    """Generate and persist a MetricsSnapshot per establishment.

    Resolves Bug 4: metrics_snapshots was never populated automatically.
    """

    def __init__(
        self,
        review_repo: IReviewRepository,
        metrics_repo: IMetricsRepository,
        model: ISentimentModel,
        ige_weights: IGEWeights = IGEWeights(),
    ) -> None:
        self._review_repo = review_repo
        self._metrics_repo = metrics_repo
        self._model = model
        self._ige_weights = ige_weights

    def execute(self) -> int:
        """Generate one snapshot per establishment for today's date.

        Returns the number of snapshots successfully saved.
        """
        establishment_ids = self._review_repo.get_distinct_establishment_ids()
        logger.info(
            "GenerateMetricsSnapshotsUseCase.execute — %d establishments",
            len(establishment_ids),
        )

        saved = 0
        for est_id in establishment_ids:
            try:
                df = self._review_repo.get_reviews_by_establishment(est_id)
                if df.empty:
                    logger.debug("No reviews for establishment %s — skipping", est_id)
                    continue

                total_reviews = len(df)
                avg_food = float(df["food_score"].mean())
                avg_service = float(df["service_score"].mean())
                avg_price = float(df["price_score"].mean())
                ige = IGECalculator.calculate(avg_food, avg_service, avg_price, self._ige_weights)

                comments = df["comment"].fillna("").tolist()
                predictions = self._model.predict(comments)
                labels = [p.label for p in predictions]
                negative_count = sum(1 for label in labels if label == "negative")
                negative_ratio = round(negative_count / total_reviews, 4) if total_reviews else 0.0

                negative_terms = ExtractNegativeTermsUseCase.execute(comments, labels)

                snapshot = MetricsSnapshot(
                    establishment_id=est_id,
                    ige=round(ige, 2),
                    avg_food=round(avg_food, 2),
                    avg_service=round(avg_service, 2),
                    avg_price=round(avg_price, 2),
                    negative_ratio=negative_ratio,
                    total_reviews=total_reviews,
                    snapshot_date=datetime.date.today(),
                    negative_terms=negative_terms,
                )
                self._metrics_repo.save_metrics_snapshot(snapshot)
                saved += 1
                logger.info(
                    "Snapshot saved — est_id=%s ige=%.2f total_reviews=%d",
                    est_id,
                    ige,
                    total_reviews,
                )

            except Exception as e:
                logger.warning(
                    "Failed to generate snapshot for establishment %s: %s",
                    est_id,
                    e,
                )
                continue

        logger.info("GenerateMetricsSnapshotsUseCase complete — %d snapshots saved", saved)
        return saved
