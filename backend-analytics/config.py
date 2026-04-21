import os

from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ANALYTICS_API_KEY: str = os.getenv("ANALYTICS_API_KEY", "")
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "v1.1.0")
    TRANSFORMER_MODEL_NAME: str = os.getenv(
        "TRANSFORMER_MODEL_NAME",
        "pysentimiento/robertuito-sentiment-analysis",
    )

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
