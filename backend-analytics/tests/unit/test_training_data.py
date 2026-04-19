"""
Unit tests for infrastructure/ml/training_data.py

Validates the TRAINING_DATA dataset used for sentiment model training.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from collections import Counter

from infrastructure.ml.evaluation_dataset import TRAINING_DATA


class TestTrainingData:
    """Tests to verify quality and structure of the training dataset."""

    def test_training_data_not_empty(self):
        """TRAINING_DATA must not be empty."""
        assert len(TRAINING_DATA) > 0

    def test_training_data_minimum_size(self):
        """Dataset must contain at least 150 examples to train a robust model."""
        assert len(TRAINING_DATA) >= 150

    def test_training_data_has_three_classes(self):
        """Dataset must contain all three classes: positive, negative, neutral."""
        labels = {label for _, label in TRAINING_DATA}
        assert labels == {"positive", "negative", "neutral"}

    def test_training_data_balanced(self):
        """No single class should represent more than 50% of the total examples."""
        total = len(TRAINING_DATA)
        label_counts = Counter(label for _, label in TRAINING_DATA)
        for label, count in label_counts.items():
            ratio = count / total
            assert ratio <= 0.5, (
                f"Class '{label}' represents {ratio:.1%} of the data (limit: 50%)"
            )

    def test_all_labels_valid(self):
        """Every label must be one of 'positive', 'negative', or 'neutral'."""
        valid_labels = {"positive", "negative", "neutral"}
        for text, label in TRAINING_DATA:
            assert label in valid_labels, f"Invalid label '{label}' for text: {text!r}"

    def test_no_empty_texts(self):
        """No training example must have an empty or whitespace-only text."""
        for text, label in TRAINING_DATA:
            assert text.strip() != "", f"Empty text found with label '{label}'"

    def test_all_texts_are_strings(self):
        """Every text in TRAINING_DATA must be a string instance."""
        for text, label in TRAINING_DATA:
            assert isinstance(text, str), (
                f"Expected str, got {type(text).__name__} for label '{label}'"
            )

    def test_all_labels_are_strings(self):
        """Every label in TRAINING_DATA must be a string instance."""
        for text, label in TRAINING_DATA:
            assert isinstance(label, str), (
                f"Expected str label, got {type(label).__name__} for text: {text!r}"
            )

    def test_training_data_is_list_of_tuples(self):
        """TRAINING_DATA must be a list of (str, str) tuples."""
        assert isinstance(TRAINING_DATA, list)
        for item in TRAINING_DATA:
            assert isinstance(item, tuple)
            assert len(item) == 2

    def test_class_distribution(self):
        """Print class distribution for visibility — no assertion, informational only."""
        label_counts = Counter(label for _, label in TRAINING_DATA)
        total = len(TRAINING_DATA)
        print("\nClass distribution in TRAINING_DATA:")
        for label in ("positive", "negative", "neutral"):
            count = label_counts.get(label, 0)
            print(f"  {label}: {count} ({count / total:.1%})")
        # No assertion — purely informational
        assert True

    def test_each_class_minimum_count(self):
        """Each class must have at least 50 examples for reliable training."""
        label_counts = Counter(label for _, label in TRAINING_DATA)
        for label in ("positive", "negative", "neutral"):
            assert label_counts[label] >= 50, (
                f"Class '{label}' has only {label_counts[label]} examples (minimum: 50)"
            )

    def test_texts_have_minimum_length(self):
        """All texts must have at least 2 characters (not single-char junk)."""
        for text, label in TRAINING_DATA:
            assert len(text.strip()) >= 2, (
                f"Suspiciously short text '{text}' with label '{label}'"
            )
