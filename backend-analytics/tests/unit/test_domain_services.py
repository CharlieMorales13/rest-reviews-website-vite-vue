"""
Unit tests for domain/services.py

Tests TextNormalizer (static normalization) and IGECalculator (IGE scoring).
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
import pandas as pd

from domain.services import TextNormalizer, IGECalculator
from domain.value_objects import IGEWeights


class TestTextNormalizer:
    """Tests for TextNormalizer.normalize() static method."""

    def test_normalize_lowercase(self):
        """Uppercase text must be converted to lowercase."""
        assert TextNormalizer.normalize("HOLA") == "hola"

    def test_normalize_removes_accents(self):
        """Accented characters must be replaced with their base ASCII equivalents."""
        assert TextNormalizer.normalize("café") == "cafe"

    def test_normalize_removes_accents_uppercase(self):
        """Accented uppercase characters must also be stripped correctly."""
        assert TextNormalizer.normalize("CAFÉ") == "cafe"

    def test_normalize_removes_special_chars(self):
        """Exclamation marks and special characters must be removed."""
        result = TextNormalizer.normalize("bien!!!")
        assert result == "bien"

    def test_normalize_handles_none(self):
        """None input must return an empty string without raising an exception."""
        assert TextNormalizer.normalize(None) == ""

    def test_normalize_handles_empty_string(self):
        """An empty string must return an empty string."""
        assert TextNormalizer.normalize("") == ""

    def test_normalize_handles_non_string(self):
        """Non-string input (e.g. int) must return an empty string."""
        assert TextNormalizer.normalize(123) == ""

    def test_normalize_handles_non_string_float(self):
        """Float input must also return an empty string."""
        assert TextNormalizer.normalize(3.14) == ""

    def test_normalize_handles_non_string_list(self):
        """List input must return an empty string."""
        assert TextNormalizer.normalize(["hola"]) == ""

    def test_normalize_combined(self):
        """Full normalization: accents, special characters, and emojis are stripped."""
        result = TextNormalizer.normalize("¡Excelente servicio! 😊")
        assert result == "excelente servicio"

    def test_normalize_keeps_numbers(self):
        """Digits must be preserved after normalization."""
        result = TextNormalizer.normalize("5 estrellas")
        assert "5" in result
        assert "estrellas" in result

    def test_normalize_trims_whitespace(self):
        """Leading and trailing whitespace must be stripped."""
        result = TextNormalizer.normalize("  hola mundo  ")
        assert result == "hola mundo"

    def test_normalize_multiple_spaces(self):
        """Text with only special characters and spaces is reduced cleanly."""
        result = TextNormalizer.normalize("!!!   ???")
        assert result == ""


class TestIGECalculator:
    """Tests for IGECalculator.calculate() and calculate_global() static methods."""

    def test_ige_perfect_scores(self):
        """Scores of 5/5/5 with default weights must yield 100.0."""
        result = IGECalculator.calculate(5, 5, 5)
        assert result == pytest.approx(100.0)

    def test_ige_minimum_scores(self):
        """Scores of 0/0/0 must yield 0.0."""
        result = IGECalculator.calculate(0, 0, 0)
        assert result == pytest.approx(0.0)

    def test_ige_weighted_food_only(self):
        """food=5 with service=0 and price=0 should yield food * 0.5 * 20 = 50.0."""
        result = IGECalculator.calculate(5, 0, 0)
        assert result == pytest.approx(50.0)

    def test_ige_weighted_service_only(self):
        """service=5 with food=0 and price=0 should yield service * 0.3 * 20 = 30.0."""
        result = IGECalculator.calculate(0, 5, 0)
        assert result == pytest.approx(30.0)

    def test_ige_weighted_price_only(self):
        """price=5 with food=0 and service=0 should yield price * 0.2 * 20 = 20.0."""
        result = IGECalculator.calculate(0, 0, 5)
        assert result == pytest.approx(20.0)

    def test_ige_typical_scores(self):
        """(4, 4, 3) → (4*0.5 + 4*0.3 + 3*0.2) * 20 = (2 + 1.2 + 0.6) * 20 = 76.0"""
        result = IGECalculator.calculate(4, 4, 3)
        expected = (4 * 0.5 + 4 * 0.3 + 3 * 0.2) * 20
        assert result == pytest.approx(expected)

    def test_ige_custom_weights(self):
        """Custom weights must be applied correctly."""
        weights = IGEWeights(food=0.4, service=0.4, price=0.2, scale=20.0)
        result = IGECalculator.calculate(5, 5, 5, weights)
        expected = (5 * 0.4 + 5 * 0.4 + 5 * 0.2) * 20.0
        assert result == pytest.approx(expected)

    def test_ige_calculate_global_empty(self):
        """An empty DataFrame must return 0.0."""
        df = pd.DataFrame(columns=["food_score", "service_score", "price_score"])
        result = IGECalculator.calculate_global(df)
        assert result == 0.0

    def test_ige_calculate_global(self, sample_reviews_df):
        """calculate_global with sample_reviews_df must return the correct average IGE."""
        weights = IGEWeights()
        # Row IGEs:
        # rev-1: (5*0.5 + 4*0.3 + 3*0.2) * 20 = (2.5 + 1.2 + 0.6) * 20 = 86.0
        # rev-2: (2*0.5 + 1*0.3 + 2*0.2) * 20 = (1.0 + 0.3 + 0.4) * 20 = 34.0
        # rev-3: (3*0.5 + 3*0.3 + 3*0.2) * 20 = (1.5 + 0.9 + 0.6) * 20 = 60.0
        # mean = (86 + 34 + 60) / 3 = 60.0
        expected = (86.0 + 34.0 + 60.0) / 3
        result = IGECalculator.calculate_global(sample_reviews_df, weights)
        assert result == pytest.approx(expected, rel=1e-4)

    def test_ige_calculate_global_single_row(self):
        """calculate_global with a single row must equal the per-row IGE."""
        df = pd.DataFrame({
            "food_score": [5],
            "service_score": [5],
            "price_score": [5],
        })
        result = IGECalculator.calculate_global(df)
        assert result == pytest.approx(100.0)
