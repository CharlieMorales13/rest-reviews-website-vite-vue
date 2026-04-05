"""
Unit tests for domain/value_objects.py

Tests SentimentLabel enum and IGEWeights frozen dataclass.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from dataclasses import FrozenInstanceError

from domain.value_objects import SentimentLabel, IGEWeights


class TestSentimentLabel:
    """Tests for the SentimentLabel string enum."""

    def test_sentiment_label_values(self):
        """Verifies that all three expected sentiment values exist."""
        assert SentimentLabel.POSITIVE == "positive"
        assert SentimentLabel.NEGATIVE == "negative"
        assert SentimentLabel.NEUTRAL == "neutral"

    def test_sentiment_label_is_string(self):
        """SentimentLabel must inherit from str so it can be compared directly."""
        assert isinstance(SentimentLabel.POSITIVE, str)
        assert isinstance(SentimentLabel.NEGATIVE, str)
        assert isinstance(SentimentLabel.NEUTRAL, str)

    def test_sentiment_label_string_equality(self):
        """SentimentLabel values compare equal to plain strings."""
        assert SentimentLabel.POSITIVE == "positive"
        assert SentimentLabel.NEGATIVE == "negative"
        assert SentimentLabel.NEUTRAL == "neutral"

    def test_sentiment_label_invalid(self):
        """Creating a SentimentLabel with an invalid value raises ValueError."""
        with pytest.raises(ValueError):
            SentimentLabel("invalid_label")

    def test_sentiment_label_has_three_members(self):
        """Enum must have exactly 3 members."""
        assert len(SentimentLabel) == 3

    def test_sentiment_label_values_are_lowercase(self):
        """All label string values must be lowercase."""
        for label in SentimentLabel:
            assert label.value == label.value.lower()


class TestIGEWeights:
    """Tests for the IGEWeights frozen dataclass."""

    def test_ige_weights_defaults(self):
        """Default weights must be food=0.5, service=0.3, price=0.2, scale=20."""
        weights = IGEWeights()
        assert weights.food == 0.5
        assert weights.service == 0.3
        assert weights.price == 0.2
        assert weights.scale == 20.0

    def test_ige_weights_frozen(self):
        """IGEWeights is frozen — modifying any field must raise FrozenInstanceError."""
        weights = IGEWeights()
        with pytest.raises(FrozenInstanceError):
            weights.food = 0.6

    def test_ige_weights_frozen_service(self):
        """Verifies the frozen constraint also applies to the service field."""
        weights = IGEWeights()
        with pytest.raises(FrozenInstanceError):
            weights.service = 0.4

    def test_ige_weights_sum(self):
        """food + service + price must sum to exactly 1.0 with default values."""
        weights = IGEWeights()
        assert abs(weights.food + weights.service + weights.price - 1.0) < 1e-9

    def test_ige_weights_custom_values(self):
        """IGEWeights can be created with custom values."""
        weights = IGEWeights(food=0.4, service=0.4, price=0.2, scale=25.0)
        assert weights.food == 0.4
        assert weights.service == 0.4
        assert weights.price == 0.2
        assert weights.scale == 25.0

    def test_ige_weights_equality(self):
        """Two IGEWeights with the same values must be equal (dataclass __eq__)."""
        w1 = IGEWeights()
        w2 = IGEWeights()
        assert w1 == w2
