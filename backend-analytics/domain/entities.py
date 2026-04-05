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
    cv_mean: float
    cv_std: float
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
