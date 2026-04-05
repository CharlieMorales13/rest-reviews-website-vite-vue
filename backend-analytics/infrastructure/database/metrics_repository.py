import logging
from typing import List

from sqlalchemy import text, Engine

from domain.interfaces import IMetricsRepository
from domain.entities import SentimentPrediction, MetricsSnapshot

logger = logging.getLogger(__name__)


class SqlAlchemyMetricsRepository(IMetricsRepository):
    """SQLAlchemy implementation of IMetricsRepository.

    Handles persistence of sentiment predictions and per-establishment
    IGE metrics snapshots.

    Bug fixes implemented here:
    - save_metrics_snapshot: snapshot generation was never automated;
      now uses upsert (ON CONFLICT) so re-runs on the same day update
      rather than duplicate the row.
    """

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def save_predictions(
        self, predictions: List[SentimentPrediction], model_version_id: str
    ) -> int:
        """Persist sentiment predictions atomically, replacing any existing ones.

        For each prediction:
        1. DELETE existing sentiment_results rows for that review_id.
        2. INSERT the new prediction.

        Returns the count of rows successfully inserted.
        """
        delete_sql = text(
            "DELETE FROM sentiment_results WHERE review_id = :review_id::uuid"
        )
        insert_sql = text(
            """
            INSERT INTO sentiment_results
                (review_id, model_version_id, predicted_label, probability)
            VALUES
                (
                    :review_id::uuid,
                    :model_version_id::uuid,
                    CAST(:label AS sentiment_label),
                    :probability
                )
            """
        )
        inserted = 0
        try:
            with self._engine.begin() as conn:
                for pred in predictions:
                    conn.execute(delete_sql, {"review_id": pred.review_id})
                    conn.execute(
                        insert_sql,
                        {
                            "review_id": pred.review_id,
                            "model_version_id": model_version_id,
                            "label": pred.label,
                            "probability": pred.probability,
                        },
                    )
                    inserted += 1
            logger.info(
                "save_predictions: inserted %d sentiment_results for model_version_id=%s",
                inserted,
                model_version_id,
            )
            return inserted
        except Exception as e:
            logger.error("save_predictions failed after %d inserts: %s", inserted, e)
            raise

    def save_metrics_snapshot(self, snapshot: MetricsSnapshot) -> None:
        """Upsert an IGE metrics snapshot for one establishment on one date.

        Uses ON CONFLICT (establishment_id, snapshot_date) DO UPDATE so that
        re-running analytics on the same day refreshes rather than duplicates
        the row.

        BUG FIX: Previously snapshots were never persisted automatically; the
        metrics_snapshots table remained empty after every analytics run.

        Note: Requires a unique constraint on (establishment_id, snapshot_date).
        If the constraint is absent, the implementation falls back to a
        DELETE + INSERT pattern to achieve idempotency.
        """
        upsert_sql = text(
            """
            INSERT INTO metrics_snapshots
                (establishment_id, ige, avg_food, avg_service, avg_price,
                 negative_ratio, total_reviews, snapshot_date)
            VALUES
                (
                    :establishment_id::uuid,
                    :ige,
                    :avg_food,
                    :avg_service,
                    :avg_price,
                    :negative_ratio,
                    :total_reviews,
                    :snapshot_date
                )
            ON CONFLICT (establishment_id, snapshot_date)
            DO UPDATE SET
                ige            = EXCLUDED.ige,
                avg_food       = EXCLUDED.avg_food,
                avg_service    = EXCLUDED.avg_service,
                avg_price      = EXCLUDED.avg_price,
                negative_ratio = EXCLUDED.negative_ratio,
                total_reviews  = EXCLUDED.total_reviews
            """
        )
        # Fallback: used when the unique constraint does not exist.
        delete_sql = text(
            """
            DELETE FROM metrics_snapshots
            WHERE establishment_id = :establishment_id::uuid
              AND snapshot_date = :snapshot_date
            """
        )
        insert_sql = text(
            """
            INSERT INTO metrics_snapshots
                (establishment_id, ige, avg_food, avg_service, avg_price,
                 negative_ratio, total_reviews, snapshot_date)
            VALUES
                (
                    :establishment_id::uuid,
                    :ige,
                    :avg_food,
                    :avg_service,
                    :avg_price,
                    :negative_ratio,
                    :total_reviews,
                    :snapshot_date
                )
            """
        )
        params = {
            "establishment_id": snapshot.establishment_id,
            "ige": snapshot.ige,
            "avg_food": snapshot.avg_food,
            "avg_service": snapshot.avg_service,
            "avg_price": snapshot.avg_price,
            "negative_ratio": snapshot.negative_ratio,
            "total_reviews": snapshot.total_reviews,
            "snapshot_date": snapshot.snapshot_date,
        }
        try:
            with self._engine.begin() as conn:
                conn.execute(upsert_sql, params)
            logger.info(
                "save_metrics_snapshot: upserted establishment_id=%s date=%s ige=%.2f",
                snapshot.establishment_id,
                snapshot.snapshot_date,
                snapshot.ige,
            )
        except Exception as upsert_err:
            # The ON CONFLICT clause requires the unique constraint to exist.
            # If it is missing (e.g. on a fresh DB without the migration applied),
            # fall back gracefully to DELETE + INSERT.
            logger.warning(
                "save_metrics_snapshot upsert failed (%s); falling back to DELETE+INSERT",
                upsert_err,
            )
            try:
                with self._engine.begin() as conn:
                    conn.execute(
                        delete_sql,
                        {
                            "establishment_id": snapshot.establishment_id,
                            "snapshot_date": snapshot.snapshot_date,
                        },
                    )
                    conn.execute(insert_sql, params)
                logger.info(
                    "save_metrics_snapshot: fallback DELETE+INSERT ok "
                    "establishment_id=%s date=%s",
                    snapshot.establishment_id,
                    snapshot.snapshot_date,
                )
            except Exception as e:
                logger.error(
                    "save_metrics_snapshot fallback also failed: %s", e
                )
                raise
