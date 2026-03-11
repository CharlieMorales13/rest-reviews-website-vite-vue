import logging
import pandas as pd
from sqlalchemy import create_engine, Engine
from config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ETL_Service")

def get_engine() -> Engine:
    """Create and return a SQLAlchemy engine using sanitized config."""
    try:
        engine = create_engine(config.sqlalchemy_db_url)
        return engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise

def extract_reviews() -> pd.DataFrame:
    """
    Extract all reviews from the database.
    Returns:
        pd.DataFrame: Contains columns [id, food_score, service_score, price_score, comment, created_at, establishment_name]
    """
    logger.info("Extracting reviews from database...")
    engine = get_engine()
    
    query = """
    SELECT r.id, r.food_score, r.service_score, r.price_score, r.comment, r.created_at, e.name as establishment_name
    FROM reviews r
    JOIN establishments e ON r.establishment_id = e.id
    """
    
    try:
        df = pd.read_sql(query, engine)
        logger.info(f"Extracted {len(df)} reviews successfully.")
        return df
    except Exception as e:
        logger.error(f"Error during extraction: {e}")
        raise

if __name__ == "__main__":
    try:
        df_reviews = extract_reviews()
        if not df_reviews.empty:
            logger.info("Sample reviews extracted:\n%s", df_reviews.head())
    except Exception:
        logger.critical("ETL process failed.")
