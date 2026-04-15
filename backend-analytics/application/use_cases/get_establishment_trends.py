"""
GetEstablishmentTrendsUseCase

Analyzes historical metrics_snapshots for a single establishment and returns
a trend report: whether the IGE is improving, declining, or stable, along with
the full time-series data for chart rendering on the frontend.

Output contract (stdout → Node.js):
    {
        "establishment_id": str,
        "ige_trend": "improving" | "declining" | "stable",
        "ige_current": float,
        "ige_delta": float,
        "negative_ratio_trend": "improving" | "worsening" | "stable",
        "data_points": [
            {"date": "YYYY-MM-DD", "ige": float, "negative_ratio": float, "total_reviews": int},
            ...
        ]
    }
"""
import logging

from domain.interfaces import IMetricsRepository

logger = logging.getLogger(__name__)

# Minimum IGE change (on the 0-100 scale) to classify as a real trend
_IGE_TREND_THRESHOLD = 5.0
# Minimum negative-ratio change to classify as a real trend
_NEG_RATIO_TREND_THRESHOLD = 0.05


class GetEstablishmentTrendsUseCase:
    """Compute IGE trend and sentiment trend for one establishment.

    Parameters
    ----------
    metrics_repo : IMetricsRepository
        Repository that provides historical metrics snapshots.
    days : int
        Look-back window in calendar days (default: 30).
    """

    def __init__(self, metrics_repo: IMetricsRepository, days: int = 30) -> None:
        self._metrics_repo = metrics_repo
        self._days = days

    def execute(self, establishment_id: str) -> dict:
        """Return the trend report dict for *establishment_id*.

        Returns a neutral/empty report when fewer than 2 data points are
        available, so callers always receive a valid JSON structure.
        """
        data_points = self._metrics_repo.get_snapshots_by_establishment(
            establishment_id, self._days
        )

        logger.info(
            "GetEstablishmentTrendsUseCase.execute — est_id=%s data_points=%d days=%d",
            establishment_id,
            len(data_points),
            self._days,
        )

        serialized = [
            {
                "date": str(dp.snapshot_date),
                "ige": dp.ige,
                "negative_ratio": dp.negative_ratio,
                "total_reviews": dp.total_reviews,
            }
            for dp in data_points
        ]

        if len(data_points) < 2:
            ige_current = data_points[0].ige if data_points else 0.0
            return {
                "establishment_id": establishment_id,
                "ige_trend": "stable",
                "ige_current": ige_current,
                "ige_delta": 0.0,
                "negative_ratio_trend": "stable",
                "data_points": serialized,
            }

        earliest = data_points[0]
        latest = data_points[-1]

        ige_delta = round(latest.ige - earliest.ige, 2)
        ige_trend = self._classify_ige_trend(ige_delta)

        neg_delta = latest.negative_ratio - earliest.negative_ratio
        neg_ratio_trend = self._classify_neg_ratio_trend(neg_delta)

        logger.info(
            "Trend result — est_id=%s ige_trend=%s ige_delta=%.2f neg_trend=%s",
            establishment_id,
            ige_trend,
            ige_delta,
            neg_ratio_trend,
        )

        return {
            "establishment_id": establishment_id,
            "ige_trend": ige_trend,
            "ige_current": latest.ige,
            "ige_delta": ige_delta,
            "negative_ratio_trend": neg_ratio_trend,
            "data_points": serialized,
        }

    @staticmethod
    def _classify_ige_trend(ige_delta: float) -> str:
        if ige_delta > _IGE_TREND_THRESHOLD:
            return "improving"
        if ige_delta < -_IGE_TREND_THRESHOLD:
            return "declining"
        return "stable"

    @staticmethod
    def _classify_neg_ratio_trend(neg_delta: float) -> str:
        # A falling negative ratio is an improvement
        if neg_delta < -_NEG_RATIO_TREND_THRESHOLD:
            return "improving"
        if neg_delta > _NEG_RATIO_TREND_THRESHOLD:
            return "worsening"
        return "stable"
