"""
Unit tests for domain/entities.py

Tests Review, SentimentPrediction, ModelMetrics, and MetricsSnapshot dataclasses.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import datetime

from domain.entities import MetricsSnapshot, ModelMetrics, Review, SentimentPrediction


class TestReview:
    """Tests for the Review dataclass."""

    def test_review_creation(self):
        """All Review fields must be accessible after creation."""
        now = datetime.datetime.now()
        review = Review(
            id="rev-001",
            food_score=4,
            service_score=5,
            price_score=3,
            comment="Muy rica la comida",
            establishment_name="DelyFull",
            establishment_id="est-001",
            created_at=now,
        )
        assert review.id == "rev-001"
        assert review.food_score == 4
        assert review.service_score == 5
        assert review.price_score == 3
        assert review.comment == "Muy rica la comida"
        assert review.establishment_name == "DelyFull"
        assert review.establishment_id == "est-001"
        assert review.created_at == now

    def test_review_fields_mutable(self):
        """Review dataclass is not frozen — fields can be reassigned."""
        review = Review(
            id="rev-002",
            food_score=3,
            service_score=3,
            price_score=3,
            comment="Regular",
            establishment_name="Cuckoo Box",
            establishment_id="est-002",
            created_at=None,
        )
        review.food_score = 5
        assert review.food_score == 5

    def test_review_accepts_none_created_at(self):
        """Review created_at field accepts None (typed as Any)."""
        review = Review(
            id="rev-003",
            food_score=2,
            service_score=2,
            price_score=2,
            comment="Malo",
            establishment_name="Guajaquenito",
            establishment_id="est-003",
            created_at=None,
        )
        assert review.created_at is None


class TestSentimentPrediction:
    """Tests for the SentimentPrediction dataclass."""

    def test_sentiment_prediction_creation(self):
        """label and probability fields must be accessible after creation."""
        pred = SentimentPrediction(
            review_id="rev-001",
            label="positive",
            probability=0.92,
        )
        assert pred.review_id == "rev-001"
        assert pred.label == "positive"
        assert pred.probability == 0.92

    def test_sentiment_prediction_label_mutable(self):
        """review_id can be assigned after creation (pipeline assigns it later)."""
        pred = SentimentPrediction(review_id="", label="negative", probability=0.85)
        pred.review_id = "rev-assigned-123"
        assert pred.review_id == "rev-assigned-123"

    def test_sentiment_prediction_accepts_all_labels(self):
        """SentimentPrediction accepts positive, negative, and neutral labels."""
        for label in ("positive", "negative", "neutral"):
            pred = SentimentPrediction(review_id="r-1", label=label, probability=0.7)
            assert pred.label == label

    def test_sentiment_prediction_probability_float(self):
        """probability must accept float values."""
        pred = SentimentPrediction(review_id="r-1", label="neutral", probability=0.0)
        assert isinstance(pred.probability, float)


class TestModelMetrics:
    """Tests for the ModelMetrics dataclass."""

    def test_model_metrics_creation(self):
        """All float fields must be accessible after creation."""
        metrics = ModelMetrics(
            accuracy=0.85,
            f1=0.84,
            precision=0.83,
            recall=0.85,
            dataset_size=181,
        )
        assert metrics.accuracy == 0.85
        assert metrics.f1 == 0.84
        assert metrics.precision == 0.83
        assert metrics.recall == 0.85
        assert metrics.dataset_size == 181

    def test_model_metrics_accuracy_range(self):
        """Accuracy values between 0.0 and 1.0 must be accepted without error."""
        for value in (0.0, 0.5, 1.0):
            metrics = ModelMetrics(
                accuracy=value,
                f1=0.5,
                precision=0.5,
                recall=0.5,
                dataset_size=100,
            )
            assert metrics.accuracy == value

    def test_model_metrics_dataset_size_int(self):
        """dataset_size must accept integer values."""
        metrics = ModelMetrics(
            accuracy=0.9,
            f1=0.9,
            precision=0.9,
            recall=0.9,
            dataset_size=500,
        )
        assert isinstance(metrics.dataset_size, int)
        assert metrics.dataset_size == 500


class TestMetricsSnapshot:
    """Tests for the MetricsSnapshot dataclass."""

    def test_metrics_snapshot_creation(self):
        """All fields must be accessible after creation."""
        today = datetime.date.today()
        snapshot = MetricsSnapshot(
            establishment_id="est-001",
            ige=78.5,
            avg_food=4.2,
            avg_service=3.8,
            avg_price=3.5,
            negative_ratio=0.15,
            total_reviews=42,
            snapshot_date=today,
        )
        assert snapshot.establishment_id == "est-001"
        assert snapshot.ige == 78.5
        assert snapshot.avg_food == 4.2
        assert snapshot.avg_service == 3.8
        assert snapshot.avg_price == 3.5
        assert snapshot.negative_ratio == 0.15
        assert snapshot.total_reviews == 42
        assert snapshot.snapshot_date == today

    def test_metrics_snapshot_accepts_none_date(self):
        """snapshot_date accepts None (typed as Any)."""
        snapshot = MetricsSnapshot(
            establishment_id="est-002",
            ige=60.0,
            avg_food=3.0,
            avg_service=3.0,
            avg_price=3.0,
            negative_ratio=0.2,
            total_reviews=10,
            snapshot_date=None,
        )
        assert snapshot.snapshot_date is None
