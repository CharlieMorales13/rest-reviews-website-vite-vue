"""
Unit tests for all use cases in application/use_cases/.

All tests use mocks only — zero access to DB or filesystem.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
import pandas as pd
from unittest.mock import MagicMock, patch, call

from domain.entities import ModelMetrics, SentimentPrediction, MetricsSnapshot
from domain.interfaces import ISentimentModel, IModelRepository, IMetricsRepository, IReviewRepository
from domain.value_objects import IGEWeights
from application.errors import ModelTrainingError
from application.use_cases.evaluate_model import EvaluateModelUseCase
from application.use_cases.train_model import TrainModelUseCase
from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
from application.use_cases.run_pipeline import RunPipelineUseCase
from application.use_cases.get_establishment_trends import GetEstablishmentTrendsUseCase
from domain.entities import TrendDataPoint


# ---------------------------------------------------------------------------
# EvaluateModelUseCase
# ---------------------------------------------------------------------------

class TestEvaluateModelUseCase:
    """Tests for EvaluateModelUseCase.execute()."""

    def test_evaluate_calls_model_evaluate(self, mock_model, small_training_data):
        """execute() must call model.evaluate() exactly once."""
        use_case = EvaluateModelUseCase(model=mock_model, training_data=small_training_data)
        use_case.execute()
        mock_model.evaluate.assert_called_once()

    def test_evaluate_returns_metrics(self, mock_model, small_training_data):
        """execute() must return the ModelMetrics object from model.evaluate()."""
        use_case = EvaluateModelUseCase(model=mock_model, training_data=small_training_data)
        result = use_case.execute()
        assert isinstance(result, ModelMetrics)
        assert result.accuracy == 0.85
        assert result.f1 == 0.84

    def test_evaluate_passes_correct_data_size(self, mock_model, small_training_data):
        """evaluate() must be called with len(texts) == len(training_data)."""
        use_case = EvaluateModelUseCase(model=mock_model, training_data=small_training_data)
        use_case.execute()
        args, _ = mock_model.evaluate.call_args
        texts, labels = args
        assert len(texts) == len(small_training_data)
        assert len(labels) == len(small_training_data)

    def test_evaluate_splits_texts_and_labels_correctly(self, mock_model, small_training_data):
        """evaluate() must receive the text portion at index 0 and label at index 1."""
        use_case = EvaluateModelUseCase(model=mock_model, training_data=small_training_data)
        use_case.execute()
        args, _ = mock_model.evaluate.call_args
        texts, labels = args
        expected_texts = [t for t, _ in small_training_data]
        expected_labels = [l for _, l in small_training_data]
        assert texts == expected_texts
        assert labels == expected_labels


# ---------------------------------------------------------------------------
# TrainModelUseCase
# ---------------------------------------------------------------------------

class TestTrainModelUseCase:
    """Tests for TrainModelUseCase.execute()."""

    def _make_use_case(self, mock_model, mock_model_repo, small_training_data):
        """Factory to build TrainModelUseCase with a mock EvaluateModelUseCase."""
        mock_evaluate = MagicMock(spec=EvaluateModelUseCase)
        mock_evaluate.execute.return_value = ModelMetrics(
            accuracy=0.85, f1=0.84, precision=0.83, recall=0.85,
            cv_mean=0.82, cv_std=0.03, dataset_size=9,
        )
        return TrainModelUseCase(
            model=mock_model,
            model_repo=mock_model_repo,
            evaluate_use_case=mock_evaluate,
            training_data=small_training_data,
            version="v1.0.0",
        )

    def test_train_creates_model_version(self, mock_model, mock_model_repo, small_training_data):
        """execute() must call model_repo.get_or_create_model_version() once."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        use_case.execute()
        mock_model_repo.get_or_create_model_version.assert_called_once()

    def test_train_creates_training_run(self, mock_model, mock_model_repo, small_training_data):
        """execute() must call model_repo.create_training_run() once."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        use_case.execute()
        mock_model_repo.create_training_run.assert_called_once()

    def test_train_updates_metrics_on_success(self, mock_model, mock_model_repo, small_training_data):
        """Bug Fix 2: execute() must call update_model_metrics() on success."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        use_case.execute()
        mock_model_repo.update_model_metrics.assert_called_once()

    def test_train_finishes_run_on_success(self, mock_model, mock_model_repo, small_training_data):
        """Bug Fix 3: execute() must call finish_training_run('success') on success."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        use_case.execute()
        mock_model_repo.finish_training_run.assert_called_once()
        args, kwargs = mock_model_repo.finish_training_run.call_args
        assert args[1] == "success"

    def test_train_finishes_run_on_failure(self, mock_model, mock_model_repo, small_training_data):
        """Bug Fix 3: when load_or_train raises, finish_training_run('failed') must be called."""
        mock_evaluate = MagicMock(spec=EvaluateModelUseCase)
        mock_evaluate.execute.return_value = ModelMetrics(
            accuracy=0.8, f1=0.8, precision=0.8, recall=0.8,
            cv_mean=0.78, cv_std=0.05, dataset_size=9,
        )
        mock_model.load_or_train.side_effect = RuntimeError("simulated training failure")

        use_case = TrainModelUseCase(
            model=mock_model,
            model_repo=mock_model_repo,
            evaluate_use_case=mock_evaluate,
            training_data=small_training_data,
            version="v1.0.0",
        )

        with pytest.raises(ModelTrainingError):
            use_case.execute()

        mock_model_repo.finish_training_run.assert_called_once()
        args, kwargs = mock_model_repo.finish_training_run.call_args
        assert args[1] == "failed"

    def test_train_raises_model_training_error_on_failure(self, mock_model, mock_model_repo, small_training_data):
        """When an exception occurs during training, it must be wrapped in ModelTrainingError."""
        mock_evaluate = MagicMock(spec=EvaluateModelUseCase)
        mock_model.load_or_train.side_effect = ValueError("bad data")

        use_case = TrainModelUseCase(
            model=mock_model,
            model_repo=mock_model_repo,
            evaluate_use_case=mock_evaluate,
            training_data=small_training_data,
            version="v1.0.0",
        )

        with pytest.raises(ModelTrainingError):
            use_case.execute()

    def test_train_returns_version_id_and_metrics(self, mock_model, mock_model_repo, small_training_data):
        """execute() must return a (version_id, ModelMetrics) tuple."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        result = use_case.execute()
        assert isinstance(result, tuple)
        version_id, metrics = result
        assert version_id == "version-uuid-123"
        assert isinstance(metrics, ModelMetrics)

    def test_train_passes_version_to_repo(self, mock_model, mock_model_repo, small_training_data):
        """get_or_create_model_version must be called with the specified version string."""
        use_case = self._make_use_case(mock_model, mock_model_repo, small_training_data)
        use_case.execute()
        args, kwargs = mock_model_repo.get_or_create_model_version.call_args
        assert args[0] == "v1.0.0"

    def test_train_finishes_run_with_error_message_on_failure(self, mock_model, mock_model_repo, small_training_data):
        """finish_training_run failure call must include the error message as third arg."""
        mock_evaluate = MagicMock(spec=EvaluateModelUseCase)
        error_msg = "GPU out of memory"
        mock_model.load_or_train.side_effect = RuntimeError(error_msg)

        use_case = TrainModelUseCase(
            model=mock_model,
            model_repo=mock_model_repo,
            evaluate_use_case=mock_evaluate,
            training_data=small_training_data,
            version="v1.0.0",
        )

        with pytest.raises(ModelTrainingError):
            use_case.execute()

        args, kwargs = mock_model_repo.finish_training_run.call_args
        # Third positional arg or 'error' kwarg must contain the error string
        error_arg = args[2] if len(args) > 2 else kwargs.get("error", "")
        assert error_msg in error_arg


# ---------------------------------------------------------------------------
# GenerateMetricsSnapshotsUseCase
# ---------------------------------------------------------------------------

class TestGenerateMetricsSnapshotsUseCase:
    """Tests for GenerateMetricsSnapshotsUseCase.execute()."""

    def _make_use_case(self, review_repo, metrics_repo, model):
        """Build GenerateMetricsSnapshotsUseCase with the given mocks."""
        return GenerateMetricsSnapshotsUseCase(
            review_repo=review_repo,
            metrics_repo=metrics_repo,
            model=model,
            ige_weights=IGEWeights(),
        )

    def test_snapshots_calls_save_for_each_establishment(
        self, mock_review_repo, mock_metrics_repo, mock_model, sample_reviews_df
    ):
        """save_metrics_snapshot must be called once per establishment with reviews."""
        mock_review_repo.get_distinct_establishment_ids.return_value = ["est-1", "est-2"]
        mock_review_repo.get_reviews_by_establishment.return_value = pd.DataFrame({
            "food_score": [4, 5],
            "service_score": [3, 4],
            "price_score": [3, 3],
            "comment": ["bueno", "excelente"],
        })
        mock_model.predict.return_value = [
            SentimentPrediction(review_id="", label="positive", probability=0.9),
            SentimentPrediction(review_id="", label="positive", probability=0.85),
        ]

        use_case = self._make_use_case(mock_review_repo, mock_metrics_repo, mock_model)
        use_case.execute()

        assert mock_metrics_repo.save_metrics_snapshot.call_count == 2

    def test_snapshots_skips_empty_establishments(
        self, mock_review_repo, mock_metrics_repo, mock_model
    ):
        """If get_reviews_by_establishment returns an empty DataFrame, skip that establishment."""
        empty_df = pd.DataFrame(columns=["food_score", "service_score", "price_score", "comment"])
        non_empty_df = pd.DataFrame({
            "food_score": [4],
            "service_score": [4],
            "price_score": [4],
            "comment": ["ok"],
        })
        mock_review_repo.get_distinct_establishment_ids.return_value = ["est-empty", "est-data"]
        mock_review_repo.get_reviews_by_establishment.side_effect = [empty_df, non_empty_df]
        mock_model.predict.return_value = [
            SentimentPrediction(review_id="", label="neutral", probability=0.6),
        ]

        use_case = self._make_use_case(mock_review_repo, mock_metrics_repo, mock_model)
        result = use_case.execute()

        assert result == 1
        assert mock_metrics_repo.save_metrics_snapshot.call_count == 1

    def test_snapshots_returns_count(
        self, mock_review_repo, mock_metrics_repo, mock_model
    ):
        """execute() must return the integer count of snapshots successfully saved."""
        mock_review_repo.get_distinct_establishment_ids.return_value = ["est-1", "est-2", "est-3"]
        mock_review_repo.get_reviews_by_establishment.return_value = pd.DataFrame({
            "food_score": [3],
            "service_score": [3],
            "price_score": [3],
            "comment": ["regular"],
        })
        mock_model.predict.return_value = [
            SentimentPrediction(review_id="", label="neutral", probability=0.5),
        ]

        use_case = self._make_use_case(mock_review_repo, mock_metrics_repo, mock_model)
        result = use_case.execute()

        assert result == 3

    def test_snapshots_continues_on_partial_failure(
        self, mock_review_repo, mock_metrics_repo, mock_model
    ):
        """If one establishment fails, execute() must continue processing the rest."""
        ok_df = pd.DataFrame({
            "food_score": [5],
            "service_score": [5],
            "price_score": [5],
            "comment": ["excelente"],
        })

        call_count = {"n": 0}

        def side_effect(est_id):
            call_count["n"] += 1
            if est_id == "est-bad":
                raise RuntimeError("DB connection lost")
            return ok_df

        mock_review_repo.get_distinct_establishment_ids.return_value = [
            "est-ok-1", "est-bad", "est-ok-2"
        ]
        mock_review_repo.get_reviews_by_establishment.side_effect = side_effect
        mock_model.predict.return_value = [
            SentimentPrediction(review_id="", label="positive", probability=0.9),
        ]

        use_case = self._make_use_case(mock_review_repo, mock_metrics_repo, mock_model)
        result = use_case.execute()

        # 2 establishments succeeded, 1 failed
        assert result == 2
        assert mock_metrics_repo.save_metrics_snapshot.call_count == 2

    def test_snapshots_no_establishments(
        self, mock_review_repo, mock_metrics_repo, mock_model
    ):
        """If there are no establishments, execute() must return 0."""
        mock_review_repo.get_distinct_establishment_ids.return_value = []

        use_case = self._make_use_case(mock_review_repo, mock_metrics_repo, mock_model)
        result = use_case.execute()

        assert result == 0
        mock_metrics_repo.save_metrics_snapshot.assert_not_called()


# ---------------------------------------------------------------------------
# RunPipelineUseCase
# ---------------------------------------------------------------------------

class TestRunPipelineUseCase:
    """Tests for RunPipelineUseCase.execute()."""

    def _make_train_use_case_mock(self, version_id="version-uuid-123"):
        """Build a mock TrainModelUseCase."""
        mock = MagicMock(spec=TrainModelUseCase)
        mock.execute.return_value = (
            version_id,
            ModelMetrics(
                accuracy=0.85, f1=0.84, precision=0.83, recall=0.85,
                cv_mean=0.82, cv_std=0.03, dataset_size=181,
            ),
        )
        return mock

    def _make_snapshots_use_case_mock(self):
        """Build a mock GenerateMetricsSnapshotsUseCase."""
        mock = MagicMock(spec=GenerateMetricsSnapshotsUseCase)
        mock.execute.return_value = 3
        return mock

    def _make_run_pipeline(
        self, review_repo, model, metrics_repo,
        train_mock=None, snapshots_mock=None, version_id="version-uuid-123"
    ):
        """Factory to build RunPipelineUseCase with mocked dependencies."""
        if train_mock is None:
            train_mock = self._make_train_use_case_mock(version_id)
        if snapshots_mock is None:
            snapshots_mock = self._make_snapshots_use_case_mock()
        return RunPipelineUseCase(
            review_repo=review_repo,
            model=model,
            train_use_case=train_mock,
            metrics_repo=metrics_repo,
            snapshots_use_case=snapshots_mock,
        )

    def test_run_pipeline_returns_correct_keys(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() output must have exactly: accuracy, f1Score, sentiment_label, ige_global."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        result = use_case.execute()

        assert set(result.keys()) == {"accuracy", "f1Score", "sentiment_label", "ige_global"}

    def test_run_pipeline_empty_reviews_returns_zeros(
        self, mock_review_repo, mock_model, mock_metrics_repo, empty_reviews_df
    ):
        """With no reviews, execute() must return zeros and 'neutral' label."""
        mock_review_repo.get_all_reviews.return_value = empty_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        result = use_case.execute()

        assert result["ige_global"] == 0.0
        assert result["accuracy"] == 0.0
        assert result["f1Score"] == 0.0
        assert result["sentiment_label"] == "neutral"

    def test_run_pipeline_calls_train(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must call train_use_case.execute() exactly once."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        train_mock = self._make_train_use_case_mock()
        use_case = self._make_run_pipeline(
            mock_review_repo, mock_model, mock_metrics_repo, train_mock=train_mock
        )
        use_case.execute()
        train_mock.execute.assert_called_once()

    def test_run_pipeline_saves_predictions(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must call metrics_repo.save_predictions() once."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        use_case.execute()

        mock_metrics_repo.save_predictions.assert_called_once()

    def test_run_pipeline_generates_snapshots(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must call snapshots_use_case.execute() once."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        snapshots_mock = self._make_snapshots_use_case_mock()
        use_case = self._make_run_pipeline(
            mock_review_repo, mock_model, mock_metrics_repo, snapshots_mock=snapshots_mock
        )
        use_case.execute()
        snapshots_mock.execute.assert_called_once()

    def test_run_pipeline_sentiment_label_is_majority(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """With 2 positive and 1 negative prediction, sentiment_label must be 'positive'."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        mock_model.predict.return_value = [
            SentimentPrediction(review_id="", label="positive", probability=0.9),
            SentimentPrediction(review_id="", label="positive", probability=0.85),
            SentimentPrediction(review_id="", label="negative", probability=0.7),
        ]

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        result = use_case.execute()

        assert result["sentiment_label"] == "positive"

    def test_run_pipeline_assigns_review_ids(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """After execute(), predictions passed to save_predictions must have review IDs assigned."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        predictions = [
            SentimentPrediction(review_id="", label="positive", probability=0.9),
            SentimentPrediction(review_id="", label="negative", probability=0.8),
            SentimentPrediction(review_id="", label="neutral",  probability=0.6),
        ]
        mock_model.predict.return_value = predictions

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        use_case.execute()

        # Retrieve the predictions list that was passed to save_predictions
        args, kwargs = mock_metrics_repo.save_predictions.call_args
        saved_predictions = args[0]

        review_ids_in_df = sample_reviews_df["id"].tolist()
        for pred, expected_id in zip(saved_predictions, review_ids_in_df):
            assert pred.review_id == str(expected_id)

    def test_run_pipeline_accuracy_rounded(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """accuracy in the output dict must be rounded to 4 decimal places."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        result = use_case.execute()

        # Check it's a float and correctly rounded (no more than 4 decimal places)
        assert isinstance(result["accuracy"], float)
        assert result["accuracy"] == round(result["accuracy"], 4)

    def test_run_pipeline_ige_global_non_negative(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """ige_global must always be >= 0.0 for valid review scores."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        result = use_case.execute()

        assert result["ige_global"] >= 0.0

    def test_run_pipeline_calls_model_predict(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must call model.predict() with the comments from the DataFrame."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        use_case.execute()

        mock_model.predict.assert_called_once()
        called_texts = mock_model.predict.call_args[0][0]
        expected_comments = sample_reviews_df["comment"].fillna("").tolist()
        assert called_texts == expected_comments


# ---------------------------------------------------------------------------
# GetEstablishmentTrendsUseCase
# ---------------------------------------------------------------------------

import datetime


def _make_data_point(days_ago: int, ige: float, neg_ratio: float, total: int = 10) -> TrendDataPoint:
    """Helper: build a TrendDataPoint with snapshot_date = today - days_ago."""
    return TrendDataPoint(
        snapshot_date=datetime.date.today() - datetime.timedelta(days=days_ago),
        ige=ige,
        negative_ratio=neg_ratio,
        total_reviews=total,
    )


class TestGetEstablishmentTrendsUseCase:
    """Tests for GetEstablishmentTrendsUseCase.execute()."""

    def _make_uc(self, mock_metrics_repo, days: int = 30) -> GetEstablishmentTrendsUseCase:
        return GetEstablishmentTrendsUseCase(mock_metrics_repo, days=days)

    def test_returns_required_keys(self, mock_metrics_repo):
        """execute() must return a dict with all required keys."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 60.0, 0.20),
            _make_data_point(10, 70.0, 0.15),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        expected_keys = {
            "establishment_id", "ige_trend", "ige_current",
            "ige_delta", "negative_ratio_trend", "data_points",
        }
        assert set(result.keys()) == expected_keys

    def test_improving_trend(self, mock_metrics_repo):
        """IGE delta > 5 must be classified as 'improving'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(25, 60.0, 0.25),
            _make_data_point(10, 70.0, 0.15),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["ige_trend"] == "improving"
        assert result["ige_delta"] == pytest.approx(10.0)

    def test_declining_trend(self, mock_metrics_repo):
        """IGE delta < -5 must be classified as 'declining'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(25, 80.0, 0.10),
            _make_data_point(5,  70.0, 0.20),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["ige_trend"] == "declining"
        assert result["ige_delta"] == pytest.approx(-10.0)

    def test_stable_trend(self, mock_metrics_repo):
        """IGE delta within ±5 must be classified as 'stable'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 72.0, 0.18),
            _make_data_point(5,  74.0, 0.17),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["ige_trend"] == "stable"

    def test_negative_ratio_improving(self, mock_metrics_repo):
        """Falling negative ratio (> 0.05 decrease) must yield 'improving'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 65.0, 0.30),
            _make_data_point(5,  66.0, 0.10),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["negative_ratio_trend"] == "improving"

    def test_negative_ratio_worsening(self, mock_metrics_repo):
        """Rising negative ratio (> 0.05 increase) must yield 'worsening'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 65.0, 0.10),
            _make_data_point(5,  63.0, 0.25),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["negative_ratio_trend"] == "worsening"

    def test_negative_ratio_stable(self, mock_metrics_repo):
        """Small negative-ratio change (≤ 0.05) must yield 'stable'."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 70.0, 0.18),
            _make_data_point(5,  71.0, 0.20),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["negative_ratio_trend"] == "stable"

    def test_no_data_returns_stable_zeros(self, mock_metrics_repo):
        """Zero data points must return ige_delta=0.0, trend='stable', empty data_points."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = []
        result = self._make_uc(mock_metrics_repo).execute("est-empty")
        assert result["ige_trend"] == "stable"
        assert result["ige_delta"] == 0.0
        assert result["ige_current"] == 0.0
        assert result["data_points"] == []

    def test_single_data_point_returns_stable(self, mock_metrics_repo):
        """With only one data point, trend must be 'stable' and delta 0.0."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(5, 75.0, 0.15),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["ige_trend"] == "stable"
        assert result["ige_delta"] == 0.0
        assert result["ige_current"] == 75.0

    def test_data_points_serialized_correctly(self, mock_metrics_repo):
        """data_points must be a list of dicts with keys: date, ige, negative_ratio, total_reviews."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(15, 68.0, 0.20, total=25),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert len(result["data_points"]) == 1
        dp = result["data_points"][0]
        assert set(dp.keys()) == {"date", "ige", "negative_ratio", "total_reviews"}
        assert dp["ige"] == 68.0
        assert dp["total_reviews"] == 25

    def test_ige_current_is_latest(self, mock_metrics_repo):
        """ige_current must be the IGE of the most recent (last) data point."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = [
            _make_data_point(20, 60.0, 0.25),
            _make_data_point(10, 75.0, 0.15),
            _make_data_point(2,  80.0, 0.10),
        ]
        result = self._make_uc(mock_metrics_repo).execute("est-1")
        assert result["ige_current"] == 80.0

    def test_establishment_id_echoed_in_result(self, mock_metrics_repo):
        """The result must contain the exact establishment_id passed in."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = []
        est_id = "12345678-0000-0000-0000-000000000000"
        result = self._make_uc(mock_metrics_repo).execute(est_id)
        assert result["establishment_id"] == est_id

    def test_calls_repo_with_correct_establishment_and_days(self, mock_metrics_repo):
        """execute() must call get_snapshots_by_establishment with the right args."""
        mock_metrics_repo.get_snapshots_by_establishment.return_value = []
        uc = GetEstablishmentTrendsUseCase(mock_metrics_repo, days=60)
        uc.execute("est-xyz")
        mock_metrics_repo.get_snapshots_by_establishment.assert_called_once_with("est-xyz", 60)
