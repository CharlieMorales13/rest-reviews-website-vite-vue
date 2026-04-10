"""
Unit tests for application/use_cases/predict_single_review.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from unittest.mock import MagicMock, patch
from domain.entities import SentimentPrediction
from domain.interfaces import ISentimentModel, IModelRepository, IMetricsRepository
from application.use_cases.predict_single_review import PredictSingleReviewUseCase


@pytest.fixture
def mock_model():
    m = MagicMock(spec=ISentimentModel)
    m._pipeline = object()  # non-None signals model is loaded
    m.predict.return_value = [
        SentimentPrediction(review_id="", label="positive", probability=0.92)
    ]
    return m


@pytest.fixture
def mock_model_repo():
    r = MagicMock(spec=IModelRepository)
    r.get_latest_model_version_id.return_value = "version-uuid-001"
    return r


@pytest.fixture
def mock_metrics_repo():
    r = MagicMock(spec=IMetricsRepository)
    r.save_predictions.return_value = 1
    return r


@pytest.fixture
def use_case(mock_model, mock_model_repo, mock_metrics_repo):
    return PredictSingleReviewUseCase(mock_model, mock_model_repo, mock_metrics_repo)


class TestPredictSingleReview:

    def test_returns_correct_label(self, use_case):
        result = use_case.execute("rev-1", "Excelente comida, muy rico")
        assert result["label"] == "positive"

    def test_returns_review_id(self, use_case):
        result = use_case.execute("rev-42", "Muy buen servicio")
        assert result["review_id"] == "rev-42"

    def test_model_ready_true_when_pipeline_loaded(self, use_case):
        result = use_case.execute("rev-1", "Buena experiencia")
        assert result["model_ready"] is True

    def test_probability_rounded_to_4_decimals(self, use_case):
        result = use_case.execute("rev-1", "texto")
        assert isinstance(result["probability"], float)
        assert 0.0 <= result["probability"] <= 1.0

    def test_saves_prediction_to_metrics_repo(self, use_case, mock_metrics_repo):
        use_case.execute("rev-1", "Comida regular")
        mock_metrics_repo.save_predictions.assert_called_once()
        args = mock_metrics_repo.save_predictions.call_args
        predictions, version_id = args[0]
        assert predictions[0].review_id == "rev-1"
        assert version_id == "version-uuid-001"

    def test_assigns_review_id_to_prediction(self, use_case, mock_model):
        use_case.execute("rev-99", "Pésimo servicio")
        pred = mock_model.predict.return_value[0]
        assert pred.review_id == "rev-99"

    def test_model_not_ready_when_pipeline_is_none(self, mock_model_repo, mock_metrics_repo):
        model = MagicMock(spec=ISentimentModel)
        model.is_loaded.return_value = False  # model not yet loaded
        uc = PredictSingleReviewUseCase(model, mock_model_repo, mock_metrics_repo)
        result = uc.execute("rev-1", "texto")
        assert result["model_ready"] is False
        assert result["label"] == "neutral"

    def test_model_not_ready_skips_db_save(self, mock_model_repo, mock_metrics_repo):
        model = MagicMock(spec=ISentimentModel)
        model.is_loaded.return_value = False
        uc = PredictSingleReviewUseCase(model, mock_model_repo, mock_metrics_repo)
        uc.execute("rev-1", "texto")
        mock_metrics_repo.save_predictions.assert_not_called()

    def test_no_version_skips_db_save_but_returns_result(
        self, mock_model, mock_metrics_repo
    ):
        repo = MagicMock(spec=IModelRepository)
        repo.get_latest_model_version_id.return_value = None
        uc = PredictSingleReviewUseCase(mock_model, repo, mock_metrics_repo)
        result = uc.execute("rev-1", "texto")
        assert result["model_ready"] is True
        assert result["label"] == "positive"
        mock_metrics_repo.save_predictions.assert_not_called()

    def test_db_save_failure_does_not_raise(self, mock_model, mock_model_repo, mock_metrics_repo):
        mock_metrics_repo.save_predictions.side_effect = Exception("DB error")
        uc = PredictSingleReviewUseCase(mock_model, mock_model_repo, mock_metrics_repo)
        result = uc.execute("rev-1", "texto")  # must not raise
        assert "label" in result
