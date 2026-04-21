"""
Shared pytest fixtures for the backend-analytics test suite.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import MagicMock

import pandas as pd
import pytest

from domain.entities import ModelMetrics, SentimentPrediction
from domain.interfaces import (
    IMetricsRepository,
    IModelRepository,
    IReviewRepository,
    ISentimentModel,
)
from domain.value_objects import IGEWeights

# --- DataFrames de prueba ---

@pytest.fixture
def sample_reviews_df():
    """DataFrame con 3 reseñas de ejemplo para pruebas."""
    return pd.DataFrame({
        "id": ["rev-1", "rev-2", "rev-3"],
        "food_score": [5, 2, 3],
        "service_score": [4, 1, 3],
        "price_score": [3, 2, 3],
        "comment": ["Excelente comida", "Pésimo servicio", "Está bien"],
        "establishment_name": ["DelyFull", "Guajaquenito", "Cuckoo Box"],
        "establishment_id": ["est-1", "est-2", "est-3"],
        "created_at": [pd.Timestamp.now()] * 3,
    })


@pytest.fixture
def empty_reviews_df():
    """DataFrame vacío con el esquema correcto."""
    return pd.DataFrame(columns=[
        "id", "food_score", "service_score", "price_score",
        "comment", "establishment_name", "establishment_id", "created_at",
    ])


@pytest.fixture
def sample_metrics():
    """ModelMetrics de ejemplo con valores realistas."""
    return ModelMetrics(
        accuracy=0.85,
        f1=0.84,
        precision=0.83,
        recall=0.85,
        dataset_size=181,
    )


@pytest.fixture
def sample_predictions():
    """Lista de SentimentPrediction de ejemplo."""
    return [
        SentimentPrediction(review_id="rev-1", label="positive", probability=0.9),
        SentimentPrediction(review_id="rev-2", label="negative", probability=0.8),
        SentimentPrediction(review_id="rev-3", label="neutral",  probability=0.6),
    ]


# --- Mocks de repositorios ---

@pytest.fixture
def mock_review_repo():
    """Mock de IReviewRepository."""
    return MagicMock(spec=IReviewRepository)


@pytest.fixture
def mock_model_repo():
    """Mock de IModelRepository con valores de retorno predefinidos."""
    repo = MagicMock(spec=IModelRepository)
    repo.get_or_create_model_version.return_value = "version-uuid-123"
    repo.create_training_run.return_value = "run-uuid-456"
    return repo


@pytest.fixture
def mock_metrics_repo():
    """Mock de IMetricsRepository con save_predictions que retorna 3."""
    repo = MagicMock(spec=IMetricsRepository)
    repo.save_predictions.return_value = 3
    return repo


@pytest.fixture
def mock_model():
    """Mock de ISentimentModel con predict y evaluate pre-configurados."""
    model = MagicMock(spec=ISentimentModel)
    model.predict.return_value = [
        SentimentPrediction(review_id="", label="positive", probability=0.9),
        SentimentPrediction(review_id="", label="negative", probability=0.8),
        SentimentPrediction(review_id="", label="neutral",  probability=0.6),
    ]
    model.evaluate.return_value = ModelMetrics(
        accuracy=0.85,
        f1=0.84,
        precision=0.83,
        recall=0.85,
        dataset_size=181,
    )
    return model


@pytest.fixture
def ige_weights():
    """IGEWeights con valores por defecto."""
    return IGEWeights()


@pytest.fixture
def small_training_data():
    """Subset mínimo de datos de entrenamiento para tests rápidos (9 ejemplos)."""
    return [
        ("excelente comida deliciosa muy rica", "positive"),
        ("muy buena atencion amable rapido", "positive"),
        ("increible servicio recomendado buenisimo", "positive"),
        ("pesimo servicio lento horrible mala atencion", "negative"),
        ("muy malo no recomiendo terrible decepcion", "negative"),
        ("horrible experiencia asqueroso peor lugar", "negative"),
        ("esta bien nada especial normal regular", "neutral"),
        ("regular precio normal cumple funcion", "neutral"),
        ("cumple su funcion nada mas ni bien ni mal", "neutral"),
    ]
