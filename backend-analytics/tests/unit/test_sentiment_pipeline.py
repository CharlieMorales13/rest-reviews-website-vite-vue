"""
Unit tests for infrastructure/ml/sentiment_pipeline.py

Tests SklearnSentimentPipeline: training, caching, prediction, and evaluation.
Uses tmp_path for isolated filesystem operations.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from unittest.mock import patch, MagicMock

from domain.entities import ModelMetrics, SentimentPrediction
from infrastructure.ml.sentiment_pipeline import SklearnSentimentPipeline
from infrastructure.ml.training_data import TRAINING_DATA


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_pipeline(tmp_path) -> SklearnSentimentPipeline:
    """Create a SklearnSentimentPipeline with a tmp path for isolation."""
    model_path = str(tmp_path / "test_model.joblib")
    return SklearnSentimentPipeline(model_path=model_path)


def _texts_labels(training_data):
    texts = [t for t, _ in training_data]
    labels = [l for _, l in training_data]
    return texts, labels


# ---------------------------------------------------------------------------
# Tests: load_or_train
# ---------------------------------------------------------------------------

class TestLoadOrTrain:
    """Tests for the load_or_train() method."""

    def test_load_or_train_creates_model(self, tmp_path, small_training_data):
        """After load_or_train(), the internal pipeline must be set (not None)."""
        pipeline = _make_pipeline(tmp_path)
        texts, labels = _texts_labels(small_training_data)
        pipeline.load_or_train(texts, labels)
        assert pipeline._pipeline is not None

    def test_load_or_train_saves_to_disk(self, tmp_path, small_training_data):
        """After training, the .joblib file must exist on disk."""
        model_path = str(tmp_path / "model.joblib")
        pipeline = SklearnSentimentPipeline(model_path=model_path)
        texts, labels = _texts_labels(small_training_data)
        pipeline.load_or_train(texts, labels, force_retrain=True)
        assert os.path.exists(model_path)

    def test_load_or_train_uses_cache(self, tmp_path, small_training_data):
        """Second call without force_retrain must load from cache, not retrain."""
        model_path = str(tmp_path / "cached_model.joblib")
        pipeline = SklearnSentimentPipeline(model_path=model_path)
        texts, labels = _texts_labels(small_training_data)

        # First call trains and saves
        pipeline.load_or_train(texts, labels)

        # Second call should load from disk (mock save_model to detect retrain)
        with patch(
            "infrastructure.ml.sentiment_pipeline.save_model"
        ) as mock_save:
            pipeline2 = SklearnSentimentPipeline(model_path=model_path)
            pipeline2.load_or_train(texts, labels)
            mock_save.assert_not_called()

    def test_load_or_train_force_retrain_ignores_cache(self, tmp_path, small_training_data):
        """force_retrain=True must always train even when a cached file exists."""
        model_path = str(tmp_path / "model_force.joblib")
        pipeline = SklearnSentimentPipeline(model_path=model_path)
        texts, labels = _texts_labels(small_training_data)

        # Train first to create cache
        pipeline.load_or_train(texts, labels)

        with patch(
            "infrastructure.ml.sentiment_pipeline.save_model"
        ) as mock_save:
            pipeline.load_or_train(texts, labels, force_retrain=True)
            mock_save.assert_called_once()


# ---------------------------------------------------------------------------
# Tests: predict
# ---------------------------------------------------------------------------

class TestPredict:
    """Tests for the predict() method."""

    @pytest.fixture(autouse=True)
    def trained_pipeline(self, tmp_path, small_training_data):
        """Provide a pre-trained pipeline for all predict tests."""
        self.pipeline = _make_pipeline(tmp_path)
        texts, labels = _texts_labels(small_training_data)
        self.pipeline.load_or_train(texts, labels, force_retrain=True)

    def test_predict_returns_correct_count(self):
        """predict() with N texts must return exactly N SentimentPrediction objects."""
        texts = ["excelente comida", "pesimo lugar", "esta bien"]
        results = self.pipeline.predict(texts)
        assert len(results) == 3

    def test_predict_returns_sentiment_predictions(self):
        """Every item in predict() output must be a SentimentPrediction instance."""
        texts = ["bueno", "malo"]
        results = self.pipeline.predict(texts)
        for item in results:
            assert isinstance(item, SentimentPrediction)

    def test_predict_labels_are_valid(self):
        """All predicted labels must be 'positive', 'negative', or 'neutral'."""
        texts = [
            "excelente servicio increible",
            "horrible terrible pesimo",
            "normal regular cumple",
        ]
        results = self.pipeline.predict(texts)
        valid_labels = {"positive", "negative", "neutral"}
        for pred in results:
            assert pred.label in valid_labels

    def test_predict_probabilities_in_range(self):
        """All predicted probabilities must be in [0.0, 1.0]."""
        texts = ["buenisimo", "malísimo", "ni fu ni fa"]
        results = self.pipeline.predict(texts)
        for pred in results:
            assert 0.0 <= pred.probability <= 1.0

    def test_predict_handles_empty_text(self):
        """An empty string must return label='neutral' and probability=0.0."""
        results = self.pipeline.predict([""])
        assert len(results) == 1
        assert results[0].label == "neutral"
        assert results[0].probability == 0.0

    def test_predict_handles_none_in_list(self):
        """A list containing None must not raise an exception."""
        try:
            results = self.pipeline.predict([None])
            # None is treated as non-string → normalized to "" → neutral
            assert len(results) == 1
            assert results[0].label == "neutral"
        except Exception as exc:
            pytest.fail(f"predict([None]) raised {type(exc).__name__}: {exc}")

    def test_predict_assigns_empty_review_id(self):
        """predict() leaves review_id as '' — the caller assigns IDs later."""
        results = self.pipeline.predict(["excelente"])
        for pred in results:
            assert pred.review_id == ""

    def test_predict_large_batch(self):
        """predict() handles a batch of 50 texts without errors."""
        texts = ["excelente comida"] * 25 + ["pesimo servicio"] * 25
        results = self.pipeline.predict(texts)
        assert len(results) == 50


# ---------------------------------------------------------------------------
# Tests: evaluate
# ---------------------------------------------------------------------------

class TestEvaluate:
    """Tests for the evaluate() method."""

    @pytest.fixture(autouse=True)
    def trained_pipeline(self, tmp_path, small_training_data):
        """Train pipeline before each evaluate test."""
        self.pipeline = _make_pipeline(tmp_path)
        texts, labels = _texts_labels(small_training_data)
        self.pipeline.load_or_train(texts, labels, force_retrain=True)

    def test_evaluate_returns_model_metrics(self, small_training_data):
        """evaluate() must return a ModelMetrics instance."""
        texts, labels = _texts_labels(small_training_data)
        result = self.pipeline.evaluate(texts, labels)
        assert isinstance(result, ModelMetrics)

    def test_evaluate_returns_valid_floats(self, small_training_data):
        """All ModelMetrics float fields must be numeric and in [0, 1]."""
        texts, labels = _texts_labels(small_training_data)
        result = self.pipeline.evaluate(texts, labels)
        for field in ("accuracy", "f1", "precision", "recall", "cv_mean"):
            value = getattr(result, field)
            assert isinstance(value, float), f"{field} is not a float"
            assert 0.0 <= value <= 1.0, f"{field}={value} is out of [0, 1]"

    def test_evaluate_dataset_size_matches_input(self, small_training_data):
        """dataset_size in ModelMetrics must equal len(texts)."""
        texts, labels = _texts_labels(small_training_data)
        result = self.pipeline.evaluate(texts, labels)
        assert result.dataset_size == len(texts)

    def test_evaluate_cv_std_non_negative(self, small_training_data):
        """cv_std must be non-negative."""
        texts, labels = _texts_labels(small_training_data)
        result = self.pipeline.evaluate(texts, labels)
        assert result.cv_std >= 0.0

    def test_evaluate_accuracy_above_baseline(self):
        """With the full TRAINING_DATA, accuracy must be above 0.5 baseline."""
        pipeline = SklearnSentimentPipeline.__new__(SklearnSentimentPipeline)
        pipeline._model_path = "dummy.joblib"
        pipeline._logger = __import__("logging").getLogger("test")

        texts = [t for t, _ in TRAINING_DATA]
        labels = [l for _, l in TRAINING_DATA]

        # Train with full dataset
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline as SKPipeline
        from infrastructure.ml.stop_words import SPANISH_STOP_WORDS
        from domain.services import TextNormalizer

        normalized = [TextNormalizer.normalize(t) for t in texts]
        sk_pipeline = SKPipeline([
            ("tfidf", TfidfVectorizer(
                max_features=2000, ngram_range=(1, 3),
                sublinear_tf=True, min_df=2,
                stop_words=SPANISH_STOP_WORDS,
            )),
            ("clf", LogisticRegression(
                random_state=42, class_weight="balanced",
                max_iter=1000, solver="lbfgs", C=1.0,
            )),
        ])
        sk_pipeline.fit(normalized, labels)
        pipeline._pipeline = sk_pipeline

        result = pipeline.evaluate(texts, labels)
        assert result.accuracy > 0.5

    def test_evaluate_f1_above_baseline(self):
        """With the full TRAINING_DATA, f1 score must be above 0.5 baseline."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline as SKPipeline
        from infrastructure.ml.stop_words import SPANISH_STOP_WORDS
        from domain.services import TextNormalizer

        texts = [t for t, _ in TRAINING_DATA]
        labels = [l for _, l in TRAINING_DATA]

        normalized = [TextNormalizer.normalize(t) for t in texts]
        sk_pipeline = SKPipeline([
            ("tfidf", TfidfVectorizer(
                max_features=2000, ngram_range=(1, 3),
                sublinear_tf=True, min_df=2,
                stop_words=SPANISH_STOP_WORDS,
            )),
            ("clf", LogisticRegression(
                random_state=42, class_weight="balanced",
                max_iter=1000, solver="lbfgs", C=1.0,
            )),
        ])
        sk_pipeline.fit(normalized, labels)

        pipeline = SklearnSentimentPipeline.__new__(SklearnSentimentPipeline)
        pipeline._model_path = "dummy.joblib"
        pipeline._logger = __import__("logging").getLogger("test")
        pipeline._pipeline = sk_pipeline

        result = pipeline.evaluate(texts, labels)
        assert result.f1 > 0.5


# ---------------------------------------------------------------------------
# Tests: pipeline not loaded
# ---------------------------------------------------------------------------

class TestPipelineNotLoaded:
    """Tests for error handling when pipeline is not initialized."""

    def test_pipeline_not_loaded_predict_raises(self, tmp_path):
        """Calling predict() before load_or_train() must raise RuntimeError."""
        pipeline = _make_pipeline(tmp_path)
        with pytest.raises(RuntimeError, match="Pipeline is not loaded"):
            pipeline.predict(["test text"])

    def test_pipeline_not_loaded_evaluate_raises(self, tmp_path):
        """Calling evaluate() before load_or_train() must raise RuntimeError."""
        pipeline = _make_pipeline(tmp_path)
        with pytest.raises(RuntimeError, match="Pipeline is not loaded"):
            pipeline.evaluate(["test text"], ["positive"])
