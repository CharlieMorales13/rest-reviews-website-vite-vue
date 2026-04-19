"""
Unit tests for all use cases in application/use_cases/.

All tests use mocks only — zero access to DB or filesystem.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
import pandas as pd
from unittest.mock import MagicMock

from domain.entities import ModelMetrics, SentimentPrediction, MetricsSnapshot
from domain.interfaces import ISentimentModel, IModelRepository, IMetricsRepository, IReviewRepository
from domain.value_objects import IGEWeights
from application.use_cases.generate_snapshots import GenerateMetricsSnapshotsUseCase
from application.use_cases.run_pipeline import RunPipelineUseCase


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

_SMALL_TRAINING_DATA = [
    ("excelente comida deliciosa", "positive"),
    ("muy buena atencion amable", "positive"),
    ("pesimo servicio horrible", "negative"),
    ("muy malo terrible decepcion", "negative"),
    ("esta bien nada especial", "neutral"),
    ("regular precio normal", "neutral"),
]


class TestRunPipelineUseCase:
    """Tests for RunPipelineUseCase.execute()."""

    def _make_snapshots_mock(self):
        mock = MagicMock(spec=GenerateMetricsSnapshotsUseCase)
        mock.execute.return_value = 3
        return mock

    def _make_run_pipeline(
        self, review_repo, model, metrics_repo, model_repo=None,
    ):
        if model_repo is None:
            model_repo = MagicMock(spec=IModelRepository)
            model_repo.get_or_create_model_version.return_value = "version-uuid-123"
            model_repo.create_training_run.return_value = "run-uuid-456"
        return RunPipelineUseCase(
            review_repo=review_repo,
            model=model,
            model_repo=model_repo,
            metrics_repo=metrics_repo,
            snapshots_use_case=self._make_snapshots_mock(),
            training_data=_SMALL_TRAINING_DATA,
            version="v1.0.0",
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

    def test_run_pipeline_calls_model_load(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must call model.load() to ensure the model is ready."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo)
        use_case.execute()

        mock_model.load.assert_called_once()

    def test_run_pipeline_creates_training_run(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """execute() must create a training_run record for the run lifecycle."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        model_repo = MagicMock(spec=IModelRepository)
        model_repo.get_or_create_model_version.return_value = "version-uuid-123"
        model_repo.create_training_run.return_value = "run-uuid-456"

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo, model_repo)
        use_case.execute()

        model_repo.create_training_run.assert_called_once()

    def test_run_pipeline_finishes_run_on_success(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """On success, finish_training_run must be called with status='success'."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        model_repo = MagicMock(spec=IModelRepository)
        model_repo.get_or_create_model_version.return_value = "version-uuid-123"
        model_repo.create_training_run.return_value = "run-uuid-456"

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo, model_repo)
        use_case.execute()

        args, _ = model_repo.finish_training_run.call_args
        assert args[1] == "success"

    def test_run_pipeline_finishes_run_on_failure(
        self, mock_review_repo, mock_model, mock_metrics_repo, sample_reviews_df
    ):
        """When model.load() raises, finish_training_run must be called with status='failed'."""
        mock_review_repo.get_all_reviews.return_value = sample_reviews_df
        mock_model.load.side_effect = RuntimeError("GPU out of memory")
        model_repo = MagicMock(spec=IModelRepository)
        model_repo.get_or_create_model_version.return_value = "version-uuid-123"
        model_repo.create_training_run.return_value = "run-uuid-456"

        use_case = self._make_run_pipeline(mock_review_repo, mock_model, mock_metrics_repo, model_repo)

        with pytest.raises(RuntimeError):
            use_case.execute()

        args, _ = model_repo.finish_training_run.call_args
        assert args[1] == "failed"

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
        model_repo = MagicMock(spec=IModelRepository)
        model_repo.get_or_create_model_version.return_value = "version-uuid-123"
        model_repo.create_training_run.return_value = "run-uuid-456"
        snapshots_mock = self._make_snapshots_mock()
        uc = RunPipelineUseCase(
            review_repo=mock_review_repo,
            model=mock_model,
            model_repo=model_repo,
            metrics_repo=mock_metrics_repo,
            snapshots_use_case=snapshots_mock,
            training_data=_SMALL_TRAINING_DATA,
            version="v1.0.0",
        )
        uc.execute()
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

        args, _ = mock_metrics_repo.save_predictions.call_args
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
