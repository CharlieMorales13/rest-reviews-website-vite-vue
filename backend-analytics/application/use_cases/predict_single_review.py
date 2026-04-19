"""
PredictSingleReviewUseCase

Classifies the sentiment of ONE review at submission time.
Does NOT retrain the model — uses the cached transformer model.

Output contract (stdout → Node.js):
    {"review_id": str, "label": str, "probability": float, "model_ready": bool}
"""
import logging
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from domain.interfaces import IMetricsRepository, IModelRepository, ISentimentModel

from domain.services import SentimentReconciler

logger = logging.getLogger(__name__)


class PredictSingleReviewUseCase:
    """Classify a single review text without retraining the model."""

    def __init__(
        self,
        model: "ISentimentModel",
        model_repo: "IModelRepository",
        metrics_repo: "IMetricsRepository",
    ) -> None:
        self._model = model
        self._model_repo = model_repo
        self._metrics_repo = metrics_repo

    def execute(
        self,
        review_id: str,
        text: str,
        food_score: Optional[float] = None,
        service_score: Optional[float] = None,
        price_score: Optional[float] = None,
    ) -> dict:
        """Classify *text* for *review_id* and persist the result.

        Returns the JSON contract dict regardless of success — never raises
        to the caller so Node.js always gets a valid response.
        """
        # 1. Check cached model exists
        try:
            self._model.load()
        except Exception:
            pass

        if not self._model.is_loaded():
            logger.warning(
                "predict_single: no cached model found for review_id=%s — "
                "admin must run the full pipeline first",
                review_id,
            )
            return {
                "review_id": review_id,
                "label": "neutral",
                "probability": 0.0,
                "model_ready": False,
            }

        # 2. Predict
        predictions = self._model.predict([text])
        pred = predictions[0]
        pred.review_id = review_id

        # 2b. Reconcile: blend text confidence with explicit star-rating signals
        final_label, final_prob = SentimentReconciler.reconcile(
            pred.label, pred.probability,
            food_score, service_score, price_score,
        )
        if final_label != pred.label:
            logger.info(
                "predict_single: reconciled review_id=%s %s→%s (prob %.4f→%.4f)",
                review_id, pred.label, final_label, pred.probability, final_prob,
            )
        pred.label = final_label
        pred.probability = final_prob

        # 3. Persist — requires a model_version_id
        version_id = self._model_repo.get_latest_model_version_id()
        if version_id is None:
            logger.warning(
                "predict_single: no model_version in DB — skipping sentiment_results insert"
            )
            return {
                "review_id": review_id,
                "label": pred.label,
                "probability": round(pred.probability, 4),
                "model_ready": True,
            }

        try:
            self._metrics_repo.save_predictions([pred], version_id)
            logger.info(
                "predict_single: saved review_id=%s label=%s prob=%.4f",
                review_id,
                pred.label,
                pred.probability,
            )
        except Exception as e:
            logger.error("predict_single: failed to persist prediction: %s", e)

        return {
            "review_id": review_id,
            "label": pred.label,
            "probability": round(pred.probability, 4),
            "model_ready": True,
        }
