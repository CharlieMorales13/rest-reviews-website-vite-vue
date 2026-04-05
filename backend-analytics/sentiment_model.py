"""
Backward compatibility shim.

Node.js (AnalyticsService.ts) invokes this file by name via:
    python sentiment_model.py

The actual implementation lives in the Clean Architecture layers:
    domain/        → entities, interfaces, pure services
    application/   → use cases
    infrastructure/→ SQLAlchemy repos, sklearn pipeline

This module re-exports the public surface that external code may import,
and delegates run_pipeline() to __main__.main().
"""
import os
import sys

# Ensure the package root is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Re-exports for any code that still does `from sentiment_model import ...`
from infrastructure.ml.sentiment_pipeline import SklearnSentimentPipeline  # noqa: F401
from infrastructure.ml.training_data import TRAINING_DATA  # noqa: F401
from domain.services import TextNormalizer  # noqa: F401


def run_pipeline() -> None:
    """Entry point for backward compatibility. Delegates to __main__.main()."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "analytics_main",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "__main__.py"),
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    mod.main()


if __name__ == "__main__":
    run_pipeline()
