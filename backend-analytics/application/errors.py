class AnalyticsError(Exception):
    """Base exception for analytics pipeline."""


class PipelineError(AnalyticsError):
    """Pipeline execution failed."""


class DataExtractionError(AnalyticsError):
    """Failed to extract data from DB."""


class ModelTrainingError(AnalyticsError):
    """Model training or evaluation failed."""


class DatabasePersistenceError(AnalyticsError):
    """Failed to persist results to DB."""
