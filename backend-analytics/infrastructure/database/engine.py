import logging

from sqlalchemy import Engine, create_engine

from config import config

logger = logging.getLogger(__name__)


def get_engine() -> Engine:
    """Create and return a SQLAlchemy engine using the sanitized DATABASE_URL from config."""
    try:
        engine = create_engine(config.sqlalchemy_db_url)
        return engine
    except Exception as e:
        logger.error("Failed to create database engine: %s", e)
        raise
