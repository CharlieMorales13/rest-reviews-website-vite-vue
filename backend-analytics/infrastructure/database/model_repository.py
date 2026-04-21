import logging
from typing import Optional

from sqlalchemy import Engine, text

from domain.entities import ModelMetrics
from domain.interfaces import IModelRepository

logger = logging.getLogger(__name__)


class SqlAlchemyModelRepository(IModelRepository):
    """SQLAlchemy implementation of IModelRepository.

    Handles model_versions and training_runs persistence.

    Bug fixes implemented here:
    - update_model_metrics: Previously non-existent; now correctly writes
      accuracy/precision/recall/f1 back to model_versions.
    - create_training_run / finish_training_run: training_runs table was
      never populated; now fully managed here.
    """

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def get_latest_model_version_id(self) -> Optional[str]:
        """Return the UUID of the most recently trained model version, or None."""
        sql = text(
            "SELECT id::text FROM model_versions ORDER BY trained_at DESC LIMIT 1"
        )
        try:
            with self._engine.begin() as conn:
                row = conn.execute(sql).fetchone()
                return row[0] if row is not None else None
        except Exception as e:
            logger.error("get_latest_model_version_id failed: %s", e)
            return None

    def get_or_create_model_version(self, version: str, dataset_size: int) -> str:
        """Return the UUID string of the model_version row, creating it if absent."""
        select_sql = text(
            "SELECT id::text FROM model_versions WHERE version = :version LIMIT 1"
        )
        insert_sql = text(
            """
            INSERT INTO model_versions (version, dataset_size, trained_at)
            VALUES (:version, :dataset_size, NOW())
            RETURNING id::text
            """
        )
        try:
            with self._engine.begin() as conn:
                row = conn.execute(select_sql, {"version": version}).fetchone()
                if row is not None:
                    version_id: str = row[0]
                    logger.info(
                        "get_or_create_model_version: found existing version=%s id=%s",
                        version,
                        version_id,
                    )
                    return version_id

                row = conn.execute(
                    insert_sql, {"version": version, "dataset_size": dataset_size}
                ).fetchone()
                version_id = row[0]  # type: ignore[index]
                logger.info(
                    "get_or_create_model_version: created version=%s id=%s",
                    version,
                    version_id,
                )
                return version_id
        except Exception as e:
            logger.error("get_or_create_model_version failed: %s", e)
            raise

    def update_model_metrics(self, version_id: str, metrics: ModelMetrics) -> None:
        """Persist evaluation metrics (accuracy, precision, recall, f1) to model_versions.

        BUG FIX: This method was never implemented before; the model_versions
        table rows were always left with NULL metric columns after training.
        """
        sql = text(
            """
            UPDATE model_versions
            SET
                accuracy  = :accuracy,
                precision = :precision,
                recall    = :recall,
                f1        = :f1
            WHERE id = CAST(:version_id AS uuid)
            """
        )
        try:
            with self._engine.begin() as conn:
                conn.execute(
                    sql,
                    {
                        "accuracy": metrics.accuracy,
                        "precision": metrics.precision,
                        "recall": metrics.recall,
                        "f1": metrics.f1,
                        "version_id": version_id,
                    },
                )
            logger.info(
                "update_model_metrics: version_id=%s accuracy=%.4f f1=%.4f",
                version_id,
                metrics.accuracy,
                metrics.f1,
            )
        except Exception as e:
            logger.error("update_model_metrics(%s) failed: %s", version_id, e)
            raise

    def create_training_run(self, model_version_id: str) -> str:
        """Insert a training_run row with status='running' and return its UUID string.

        BUG FIX: training_runs was never populated; this is the first real
        implementation that tracks run lifecycle.
        """
        sql = text(
            """
            INSERT INTO training_runs (model_version_id, started_at, status)
            VALUES (CAST(:model_version_id AS uuid), NOW(), 'running')
            RETURNING id::text
            """
        )
        try:
            with self._engine.begin() as conn:
                row = conn.execute(
                    sql, {"model_version_id": model_version_id}
                ).fetchone()
                run_id: str = row[0]  # type: ignore[index]
            logger.info(
                "create_training_run: model_version_id=%s run_id=%s",
                model_version_id,
                run_id,
            )
            return run_id
        except Exception as e:
            logger.error(
                "create_training_run(model_version_id=%s) failed: %s",
                model_version_id,
                e,
            )
            raise

    def finish_training_run(
        self, run_id: str, status: str, error: Optional[str] = None
    ) -> None:
        """Mark a training run as complete (status: 'success' | 'failed').

        BUG FIX: Companion to create_training_run; previously the run lifecycle
        was never closed, leaving rows stuck in 'running' indefinitely.
        """
        sql = text(
            """
            UPDATE training_runs
            SET
                finished_at   = NOW(),
                status        = CAST(:status AS training_status),
                error_message = :error
            WHERE id = CAST(:run_id AS uuid)
            """
        )
        try:
            with self._engine.begin() as conn:
                conn.execute(
                    sql,
                    {
                        "status": status,
                        "error": error,
                        "run_id": run_id,
                    },
                )
            logger.info(
                "finish_training_run: run_id=%s status=%s", run_id, status
            )
        except Exception as e:
            logger.error(
                "finish_training_run(run_id=%s, status=%s) failed: %s",
                run_id,
                status,
                e,
            )
            raise
