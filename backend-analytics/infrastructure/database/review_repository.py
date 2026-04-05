import logging
from typing import List

import pandas as pd
from sqlalchemy import text, Engine

from domain.interfaces import IReviewRepository

logger = logging.getLogger(__name__)


class SqlAlchemyReviewRepository(IReviewRepository):
    """SQLAlchemy implementation of IReviewRepository.

    All queries use named parameters to prevent SQL injection.
    """

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def get_all_reviews(self) -> pd.DataFrame:
        """Return a DataFrame with all reviews joined to their establishment.

        Columns: id, food_score, service_score, price_score, comment,
                 created_at, establishment_name, establishment_id.
        Returns an empty DataFrame on failure.
        """
        query = text(
            """
            SELECT
                r.id,
                r.food_score,
                r.service_score,
                r.price_score,
                r.comment,
                r.created_at,
                e.name  AS establishment_name,
                e.id    AS establishment_id
            FROM reviews r
            JOIN establishments e ON r.establishment_id = e.id
            """
        )
        try:
            df = pd.read_sql(query, self._engine)
            logger.info("get_all_reviews: fetched %d rows", len(df))
            return df
        except Exception as e:
            logger.error("get_all_reviews failed: %s", e)
            raise

    def get_distinct_establishment_ids(self) -> List[str]:
        """Return a list of distinct establishment UUID strings present in reviews."""
        query = text(
            "SELECT DISTINCT establishment_id::text FROM reviews"
        )
        try:
            with self._engine.connect() as conn:
                result = conn.execute(query)
                ids: List[str] = [row[0] for row in result]
            logger.info(
                "get_distinct_establishment_ids: found %d establishments", len(ids)
            )
            return ids
        except Exception as e:
            logger.error("get_distinct_establishment_ids failed: %s", e)
            raise

    def get_reviews_by_establishment(self, establishment_id: str) -> pd.DataFrame:
        """Return a DataFrame of reviews for a single establishment.

        Uses a parameterised WHERE clause to avoid SQL injection.
        """
        query = text(
            """
            SELECT
                r.id,
                r.food_score,
                r.service_score,
                r.price_score,
                r.comment,
                r.created_at,
                e.name  AS establishment_name,
                e.id    AS establishment_id
            FROM reviews r
            JOIN establishments e ON r.establishment_id = e.id
            WHERE r.establishment_id = :eid
            """
        )
        try:
            df = pd.read_sql(query, self._engine, params={"eid": establishment_id})
            logger.info(
                "get_reviews_by_establishment(%s): fetched %d rows",
                establishment_id,
                len(df),
            )
            return df
        except Exception as e:
            logger.error(
                "get_reviews_by_establishment(%s) failed: %s", establishment_id, e
            )
            raise
