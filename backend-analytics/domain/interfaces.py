from abc import ABC, abstractmethod
from typing import List, Optional

import pandas as pd

from .entities import SentimentPrediction, ModelMetrics, MetricsSnapshot


class IReviewRepository(ABC):
    @abstractmethod
    def get_all_reviews(self) -> pd.DataFrame:
        """Return DataFrame with cols: id, food_score, service_score, price_score,
        comment, establishment_name, establishment_id, created_at."""
        ...

    @abstractmethod
    def get_distinct_establishment_ids(self) -> List[str]:
        ...

    @abstractmethod
    def get_reviews_by_establishment(self, establishment_id: str) -> pd.DataFrame:
        ...


class IModelRepository(ABC):
    @abstractmethod
    def get_or_create_model_version(self, version: str, dataset_size: int) -> str:
        """Return the UUID string of the model_version record."""
        ...

    @abstractmethod
    def get_latest_model_version_id(self) -> Optional[str]:
        """Return the UUID string of the most recently trained model version, or None."""
        ...

    @abstractmethod
    def update_model_metrics(self, version_id: str, metrics: ModelMetrics) -> None:
        ...

    @abstractmethod
    def create_training_run(self, model_version_id: str) -> str:
        """Return the UUID string of the training_run record."""
        ...

    @abstractmethod
    def finish_training_run(self, run_id: str, status: str, error: Optional[str] = None) -> None:
        """Mark a training run as complete.

        status: "success" | "failed"
        """
        ...


class IMetricsRepository(ABC):
    @abstractmethod
    def save_predictions(self, predictions: List[SentimentPrediction], model_version_id: str) -> int:
        """Persist predictions and return the count of records saved."""
        ...

    @abstractmethod
    def save_metrics_snapshot(self, snapshot: MetricsSnapshot) -> None:
        ...


class ISentimentModel(ABC):
    @abstractmethod
    def load_or_train(
        self,
        texts: List[str],
        labels: List[str],
        force_retrain: bool = False,
    ) -> None:
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        """Return True if the model is ready to predict."""
        ...

    @abstractmethod
    def predict(self, texts: List[str]) -> List[SentimentPrediction]:
        ...

    @abstractmethod
    def evaluate(self, texts: List[str], labels: List[str]) -> ModelMetrics:
        ...
