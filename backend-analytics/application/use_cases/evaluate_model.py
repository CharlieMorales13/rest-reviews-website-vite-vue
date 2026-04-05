import logging
from typing import List, Tuple

from domain.entities import ModelMetrics
from domain.interfaces import ISentimentModel

logger = logging.getLogger(__name__)


class EvaluateModelUseCase:
    """Evaluate an already-loaded sentiment model against the training dataset."""

    def __init__(
        self,
        model: ISentimentModel,
        training_data: List[Tuple[str, str]],
    ) -> None:
        self._model = model
        self._training_data = training_data

    def execute(self) -> ModelMetrics:
        """Run evaluation and return ModelMetrics.

        Splits texts/labels from the training data and delegates to the
        ISentimentModel.evaluate() method which performs a train/test split
        plus cross-validation internally.
        """
        logger.info(
            "EvaluateModelUseCase.execute — dataset_size=%d",
            len(self._training_data),
        )
        texts = [t for t, _ in self._training_data]
        labels = [l for _, l in self._training_data]
        metrics = self._model.evaluate(texts, labels)
        logger.info(
            "Evaluation complete — accuracy=%.4f f1=%.4f",
            metrics.accuracy,
            metrics.f1,
        )
        return metrics
