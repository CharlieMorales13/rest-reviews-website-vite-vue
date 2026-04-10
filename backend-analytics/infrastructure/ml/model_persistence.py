import os
import logging
from typing import Optional

import joblib
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)


def _get_supabase_client():
    """Return a Supabase client if credentials are configured, else None."""
    from config import config
    if not config.SUPABASE_URL or not config.SUPABASE_KEY:
        return None
    try:
        from supabase import create_client
        return create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
    except Exception as e:
        logger.warning("Could not create Supabase client: %s", e)
        return None


def save_model(pipeline: Pipeline, model_path: str) -> str:
    """Serialize pipeline to disk and upload to Supabase Storage."""
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(pipeline, model_path)
    logger.info("Model saved locally to %s", model_path)

    client = _get_supabase_client()
    if client is None:
        logger.warning("Supabase not configured — model saved locally only")
        return model_path

    from config import config
    try:
        with open(model_path, "rb") as f:
            data = f.read()
        client.storage.from_(config.SUPABASE_MODEL_BUCKET).upload(
            path=config.SUPABASE_MODEL_OBJECT,
            file=data,
            file_options={"content-type": "application/octet-stream", "upsert": "true"},
        )
        logger.info("Model uploaded to Supabase Storage bucket=%s", config.SUPABASE_MODEL_BUCKET)
    except Exception as e:
        logger.error("Failed to upload model to Supabase Storage: %s", e)

    return model_path


def load_model(model_path: str) -> Optional[Pipeline]:
    """Load pipeline from disk. If not found locally, try downloading from Supabase Storage."""
    if os.path.exists(model_path):
        logger.info("Loading cached model from %s", model_path)
        return joblib.load(model_path)

    logger.info("Model not found locally — attempting download from Supabase Storage")
    client = _get_supabase_client()
    if client is None:
        logger.warning("Supabase not configured — cannot download model")
        return None

    from config import config
    try:
        response = client.storage.from_(config.SUPABASE_MODEL_BUCKET).download(
            config.SUPABASE_MODEL_OBJECT
        )
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        with open(model_path, "wb") as f:
            f.write(response)
        logger.info("Model downloaded from Supabase Storage to %s", model_path)
        return joblib.load(model_path)
    except Exception as e:
        logger.warning("Could not download model from Supabase Storage: %s", e)
        return None
