"""
TransformerSentimentPipeline

HuggingFace-based sentiment classifier using a pretrained Spanish model.
Default: pysentimiento/robertuito-sentiment-analysis (POS/NEG/NEU).

Key differences from SklearnSentimentPipeline:
- No training — model is downloaded from HuggingFace Hub and cached locally.
- load_or_train() ignores texts/labels/force_retrain (nothing to train).
- TextNormalizer is NOT applied — the transformer tokenizer handles raw Spanish text.
- evaluate() runs inference on the full dataset; cv_mean/cv_std are set to 0.0.
"""
import logging
from collections import Counter
from typing import List

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)

from domain.entities import ModelMetrics, SentimentPrediction
from domain.interfaces import ISentimentModel

logger = logging.getLogger(__name__)

# pysentimiento outputs POS/NEG/NEU — map to DB schema values
_LABEL_MAP = {"POS": "positive", "NEG": "negative", "NEU": "neutral"}


class TransformerSentimentPipeline(ISentimentModel):
    """Pretrained Spanish transformer sentiment classifier."""

    def __init__(self, model_name: str = "pysentimiento/robertuito-sentiment-analysis") -> None:
        self._model_name = model_name
        self._classifier = None  # transformers.pipeline instance, loaded lazily

    # ------------------------------------------------------------------ #
    # ISentimentModel implementation                                       #
    # ------------------------------------------------------------------ #

    def is_loaded(self) -> bool:
        return self._classifier is not None

    def load_or_train(
        self,
        texts: List[str],
        labels: List[str],
        force_retrain: bool = False,
    ) -> None:
        """Load the pretrained model from HuggingFace Hub (cached after first download).

        texts, labels, and force_retrain are ignored — this model is pretrained.
        """
        if self._classifier is not None and not force_retrain:
            return

        logger.info("Loading transformer model: %s", self._model_name)
        from transformers import pipeline
        self._classifier = pipeline(
            "sentiment-analysis",
            model=self._model_name,
            tokenizer=self._model_name,
        )
        logger.info("Transformer model loaded successfully")

    def predict(self, texts: List[str]) -> List[SentimentPrediction]:
        """Classify a batch of texts. Empty texts return neutral with probability 0."""
        if self._classifier is None:
            raise RuntimeError("Model not loaded. Call load_or_train() before predict().")

        results: List[SentimentPrediction] = []
        for text in texts:
            if not text or not text.strip():
                results.append(SentimentPrediction(review_id="", label="neutral", probability=0.0))
                continue
            # Truncate to 512 tokens max (transformer limit)
            output = self._classifier(text[:512])[0]
            label = _LABEL_MAP.get(output["label"], "neutral")
            results.append(SentimentPrediction(
                review_id="",
                label=label,
                probability=round(float(output["score"]), 4),
            ))
        return results

    def evaluate(self, texts: List[str], labels: List[str]) -> ModelMetrics:
        """Evaluate pretrained model against rule-based labels.

        No train/test split — runs inference on the full dataset.
        cv_mean and cv_std are 0.0 (cross-validation is not applicable).
        """
        if self._classifier is None:
            raise RuntimeError("Model not loaded. Call load_or_train() before evaluate().")

        predictions = self.predict(texts)
        y_pred = [p.label for p in predictions]
        y_true = labels

        accuracy = float(accuracy_score(y_true, y_pred))
        f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
        precision = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
        recall = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))

        dataset_size = len(texts)
        label_dist = Counter(y_true)
        logger.info(
            "Transformer evaluation — accuracy=%.4f f1=%.4f dataset_size=%d dist=%s",
            accuracy, f1, dataset_size, dict(label_dist),
        )

        return ModelMetrics(
            accuracy=accuracy,
            f1=f1,
            precision=precision,
            recall=recall,
            cv_mean=0.0,
            cv_std=0.0,
            dataset_size=dataset_size,
        )
