import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
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
