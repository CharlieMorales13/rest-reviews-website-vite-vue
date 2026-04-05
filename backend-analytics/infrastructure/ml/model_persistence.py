import os
import logging
from typing import Optional

import joblib
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)


def save_model(pipeline: Pipeline, model_path: str) -> str:
    """Serialize pipeline to disk using joblib."""
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(pipeline, model_path)
    logger.info("Model saved to %s", model_path)
    return model_path


def load_model(model_path: str) -> Optional[Pipeline]:
    """Load pipeline from disk. Returns None if not found."""
    if os.path.exists(model_path):
        logger.info("Loading cached model from %s", model_path)
        return joblib.load(model_path)
    return None
