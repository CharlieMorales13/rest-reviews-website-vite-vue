from dataclasses import dataclass
from typing import Any


@dataclass
class Review:
    id: str
    food_score: int
    service_score: int
    price_score: int
    comment: str
    establishment_name: str
    establishment_id: str
    created_at: Any


@dataclass
class SentimentPrediction:
    review_id: str
    label: str   # "positive" | "negative" | "neutral"
    probability: float


@dataclass
class ModelMetrics:
    accuracy: float
    f1: float
    precision: float
    recall: float
    dataset_size: int


@dataclass
class MetricsSnapshot:
    establishment_id: str
    ige: float
    avg_food: float
    avg_service: float
    avg_price: float
    negative_ratio: float
    total_reviews: int
    snapshot_date: Any  # datetime.date
    negative_terms: Any = None  # list[{"term": str, "mentions": int}] | None


@dataclass
class TrendDataPoint:
    """Single time-series entry for trend analysis."""
    snapshot_date: Any  # datetime.date
    ige: float
    negative_ratio: float
    total_reviews: int


@dataclass
class EstablishmentTrend:
    """Aggregated trend report for one establishment."""
    establishment_id: str
    ige_trend: str  # "improving" | "declining" | "stable"
    ige_current: float
    ige_delta: float
    negative_ratio_trend: str  # "improving" | "worsening" | "stable"
    data_points: Any  # List[TrendDataPoint]
