"""
Unit tests for infrastructure/ml/transformer_pipeline.py

TransformerSentimentPipeline wraps a HuggingFace pipeline — all tests mock
the underlying `transformers.pipeline` so no model download happens.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from unittest.mock import patch, MagicMock

from domain.entities import ModelMetrics, SentimentPrediction
from infrastructure.ml.transformer_pipeline import TransformerSentimentPipeline


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_hf_output(label: str, score: float) -> list:
    """Simulate a single HuggingFace pipeline() call result."""
    return [{"label": label, "score": score}]


def _make_pipeline(model_name: str = "pysentimiento/robertuito-sentiment-analysis") -> TransformerSentimentPipeline:
    return TransformerSentimentPipeline(model_name=model_name)


def _attach_mock_classifier(pipeline: TransformerSentimentPipeline, side_effects: list) -> MagicMock:
    """Inject a mock classifier that returns side_effects in order."""
    mock_clf = MagicMock()
    mock_clf.side_effect = side_effects
    pipeline._classifier = mock_clf
    return mock_clf


# ---------------------------------------------------------------------------
# Tests: is_loaded
# ---------------------------------------------------------------------------

class TestIsLoaded:

    def test_is_loaded_false_before_load(self):
        """is_loaded() must return False before load_or_train() is called."""
        p = _make_pipeline()
        assert p.is_loaded() is False

    def test_is_loaded_true_after_load(self):
        """is_loaded() must return True once _classifier is set."""
        p = _make_pipeline()
        p._classifier = MagicMock()
        assert p.is_loaded() is True


# ---------------------------------------------------------------------------
# Tests: load_or_train
# ---------------------------------------------------------------------------

class TestLoadOrTrain:

    def test_load_or_train_sets_classifier(self):
        """After load_or_train(), _classifier must not be None."""
        p = _make_pipeline()
        mock_clf = MagicMock()
        with patch("infrastructure.ml.transformer_pipeline.hf_pipeline", return_value=mock_clf) as mock_hf:
            p.load_or_train([], [])
            mock_hf.assert_called_once_with(
                "sentiment-analysis",
                model="pysentimiento/robertuito-sentiment-analysis",
                tokenizer="pysentimiento/robertuito-sentiment-analysis",
            )
        assert p._classifier is mock_clf

    def test_load_or_train_skips_if_already_loaded(self):
        """Second call without force_retrain must not re-import the model."""
        p = _make_pipeline()
        existing = MagicMock()
        p._classifier = existing
        with patch("infrastructure.ml.transformer_pipeline.hf_pipeline") as mock_hf:
            p.load_or_train([], [])
            mock_hf.assert_not_called()
        assert p._classifier is existing

    def test_load_or_train_force_retrain_reloads(self):
        """force_retrain=True must reload even when classifier is already set."""
        p = _make_pipeline()
        p._classifier = MagicMock()
        new_clf = MagicMock()
        with patch("infrastructure.ml.transformer_pipeline.hf_pipeline", return_value=new_clf):
            p.load_or_train([], [], force_retrain=True)
        assert p._classifier is new_clf

    def test_load_or_train_ignores_texts_and_labels(self):
        """texts and labels must be accepted but never used for training."""
        p = _make_pipeline()
        with patch("infrastructure.ml.transformer_pipeline.hf_pipeline", return_value=MagicMock()):
            p.load_or_train(["texto"], ["positive"])
        assert p.is_loaded()

    def test_load_or_train_uses_custom_model_name(self):
        """The custom model name passed to __init__ must be forwarded to pipeline()."""
        custom_name = "nlptown/bert-base-multilingual-uncased-sentiment"
        p = _make_pipeline(model_name=custom_name)
        with patch("infrastructure.ml.transformer_pipeline.hf_pipeline") as mock_hf:
            mock_hf.return_value = MagicMock()
            p.load_or_train([], [])
            mock_hf.assert_called_once_with(
                "sentiment-analysis",
                model=custom_name,
                tokenizer=custom_name,
            )


# ---------------------------------------------------------------------------
# Tests: predict
# ---------------------------------------------------------------------------

class TestPredict:

    @pytest.fixture(autouse=True)
    def loaded_pipeline(self):
        """Provide a pipeline with a mock classifier for all predict tests."""
        self.p = _make_pipeline()
        self.mock_clf = MagicMock()
        self.p._classifier = self.mock_clf

    def test_predict_positive_maps_correctly(self):
        """HuggingFace POS label must map to 'positive'."""
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.95)]
        results = self.p.predict(["Excelente comida"])
        assert results[0].label == "positive"
        assert results[0].probability == 0.95

    def test_predict_negative_maps_correctly(self):
        """HuggingFace NEG label must map to 'negative'."""
        self.mock_clf.side_effect = [_make_hf_output("NEG", 0.88)]
        results = self.p.predict(["Pésimo servicio"])
        assert results[0].label == "negative"

    def test_predict_neutral_maps_correctly(self):
        """HuggingFace NEU label must map to 'neutral'."""
        self.mock_clf.side_effect = [_make_hf_output("NEU", 0.70)]
        results = self.p.predict(["Regular, nada especial"])
        assert results[0].label == "neutral"

    def test_predict_unknown_label_defaults_to_neutral(self):
        """An unrecognized label from HuggingFace must default to 'neutral'."""
        self.mock_clf.side_effect = [_make_hf_output("UNKNOWN", 0.50)]
        results = self.p.predict(["texto"])
        assert results[0].label == "neutral"

    def test_predict_returns_sentiment_prediction_instances(self):
        """Each result must be a SentimentPrediction."""
        self.mock_clf.side_effect = [
            _make_hf_output("POS", 0.9),
            _make_hf_output("NEG", 0.8),
        ]
        results = self.p.predict(["bueno", "malo"])
        for r in results:
            assert isinstance(r, SentimentPrediction)

    def test_predict_returns_correct_count(self):
        """predict() with N texts must return exactly N results."""
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.9)] * 5
        results = self.p.predict(["texto"] * 5)
        assert len(results) == 5

    def test_predict_empty_string_returns_neutral_zero(self):
        """An empty string must return label='neutral' and probability=0.0 without calling the classifier."""
        results = self.p.predict([""])
        self.mock_clf.assert_not_called()
        assert results[0].label == "neutral"
        assert results[0].probability == 0.0

    def test_predict_whitespace_only_returns_neutral_zero(self):
        """A whitespace-only string must behave the same as empty."""
        results = self.p.predict(["   "])
        self.mock_clf.assert_not_called()
        assert results[0].label == "neutral"
        assert results[0].probability == 0.0

    def test_predict_assigns_empty_review_id(self):
        """predict() leaves review_id as '' — caller assigns IDs."""
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.9)]
        results = self.p.predict(["bueno"])
        assert results[0].review_id == ""

    def test_predict_probability_rounded_to_4_decimals(self):
        """Probability must be rounded to 4 decimal places."""
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.912345678)]
        results = self.p.predict(["texto"])
        assert results[0].probability == round(0.912345678, 4)

    def test_predict_probabilities_in_range(self):
        """All probabilities must be in [0.0, 1.0]."""
        self.mock_clf.side_effect = [
            _make_hf_output("POS", 0.95),
            _make_hf_output("NEG", 0.80),
            _make_hf_output("NEU", 0.60),
        ]
        results = self.p.predict(["a", "b", "c"])
        for r in results:
            assert 0.0 <= r.probability <= 1.0

    def test_predict_truncates_long_text(self):
        """Texts longer than 512 chars must be truncated before passing to classifier."""
        long_text = "a" * 600
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.9)]
        self.p.predict([long_text])
        called_with = self.mock_clf.call_args[0][0]
        assert len(called_with) <= 512

    def test_predict_large_batch(self):
        """predict() handles a batch of 50 texts without errors."""
        self.mock_clf.side_effect = [_make_hf_output("POS", 0.9)] * 50
        results = self.p.predict(["texto"] * 50)
        assert len(results) == 50

    def test_predict_mixed_empty_and_nonempty(self):
        """Empty texts in a mixed batch must not trigger classifier calls."""
        self.mock_clf.side_effect = [_make_hf_output("NEG", 0.85)]
        results = self.p.predict(["", "pesimo"])
        assert results[0].label == "neutral"
        assert results[0].probability == 0.0
        assert results[1].label == "negative"
        self.mock_clf.assert_called_once()

    def test_predict_raises_if_not_loaded(self):
        """predict() before load_or_train() must raise RuntimeError."""
        p = _make_pipeline()
        with pytest.raises(RuntimeError, match="Model not loaded"):
            p.predict(["texto"])


# ---------------------------------------------------------------------------
# Tests: evaluate
# ---------------------------------------------------------------------------

class TestEvaluate:

    @pytest.fixture(autouse=True)
    def loaded_pipeline(self):
        self.p = _make_pipeline()
        self.mock_clf = MagicMock()
        self.p._classifier = self.mock_clf

    def _setup_clf(self, labels_and_scores: list):
        """Configure mock_clf to return mapped HuggingFace labels."""
        _reverse = {"positive": "POS", "negative": "NEG", "neutral": "NEU"}
        self.mock_clf.side_effect = [
            _make_hf_output(_reverse.get(lbl, "NEU"), score)
            for lbl, score in labels_and_scores
        ]

    def test_evaluate_returns_model_metrics(self):
        """evaluate() must return a ModelMetrics instance."""
        texts = ["excelente", "pesimo", "regular"]
        labels = ["positive", "negative", "neutral"]
        self._setup_clf([("positive", 0.9), ("negative", 0.8), ("neutral", 0.7)])
        result = self.p.evaluate(texts, labels)
        assert isinstance(result, ModelMetrics)

    def test_evaluate_dataset_size_matches_input(self):
        """dataset_size must equal len(texts)."""
        texts = ["a", "b", "c", "d"]
        labels = ["positive", "negative", "neutral", "positive"]
        self._setup_clf([("positive", 0.9), ("negative", 0.8), ("neutral", 0.7), ("positive", 0.85)])
        result = self.p.evaluate(texts, labels)
        assert result.dataset_size == 4

    def test_evaluate_cv_mean_and_std_are_zero(self):
        """cv_mean and cv_std must be 0.0 — cross-validation is N/A for pretrained models."""
        texts = ["bueno", "malo"]
        labels = ["positive", "negative"]
        self._setup_clf([("positive", 0.9), ("negative", 0.85)])
        result = self.p.evaluate(texts, labels)
        assert result.cv_mean == 0.0
        assert result.cv_std == 0.0

    def test_evaluate_metrics_in_range(self):
        """All float metrics must be in [0.0, 1.0]."""
        texts = ["excelente", "horrible", "regular"]
        labels = ["positive", "negative", "neutral"]
        self._setup_clf([("positive", 0.9), ("negative", 0.8), ("neutral", 0.7)])
        result = self.p.evaluate(texts, labels)
        for field in ("accuracy", "f1", "precision", "recall"):
            value = getattr(result, field)
            assert isinstance(value, float), f"{field} is not a float"
            assert 0.0 <= value <= 1.0, f"{field}={value} out of [0, 1]"

    def test_evaluate_perfect_predictions_give_high_accuracy(self):
        """When all predictions match labels, accuracy must be 1.0."""
        texts = ["excelente comida", "pésimo servicio", "está bien"]
        labels = ["positive", "negative", "neutral"]
        self._setup_clf([("positive", 0.95), ("negative", 0.90), ("neutral", 0.75)])
        result = self.p.evaluate(texts, labels)
        assert result.accuracy == 1.0

    def test_evaluate_wrong_predictions_give_low_accuracy(self):
        """When all predictions are wrong, accuracy must be 0.0."""
        texts = ["excelente comida", "pésimo servicio", "está bien"]
        labels = ["positive", "negative", "neutral"]
        # Classifier returns the wrong label every time
        self._setup_clf([("negative", 0.8), ("neutral", 0.7), ("positive", 0.6)])
        result = self.p.evaluate(texts, labels)
        assert result.accuracy == 0.0

    def test_evaluate_raises_if_not_loaded(self):
        """evaluate() before load_or_train() must raise RuntimeError."""
        p = _make_pipeline()
        with pytest.raises(RuntimeError, match="Model not loaded"):
            p.evaluate(["texto"], ["positive"])
