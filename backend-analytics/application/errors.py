class AnalyticsError(Exception):
    """Base exception for analytics pipeline."""


class ModelTrainingError(AnalyticsError):
    """Model training or evaluation failed."""
