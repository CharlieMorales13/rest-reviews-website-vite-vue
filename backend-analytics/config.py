import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "v1.1.0")
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    MODEL_PATH: str = os.path.join(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"),
        "sentiment_pipeline.joblib",
    )
    
    # Sanitize DATABASE_URL for SQLAlchemy if needed
    @property
    def sqlalchemy_db_url(self) -> str:
        url = self.DATABASE_URL
        if not url:
            raise ValueError("DATABASE_URL is not set")
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if "?" in url:
            url = url.split("?")[0]
        return url

config = Config()
