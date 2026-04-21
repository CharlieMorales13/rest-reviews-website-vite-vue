"""
Unit tests for domain/services.py — SentimentReconciler
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from domain.services import SentimentReconciler


class TestSentimentReconciler:

    # ── No scores provided ────────────────────────────────────────────────

    def test_no_scores_returns_original_label(self):
        label, prob = SentimentReconciler.reconcile("positive", 0.55)
        assert label == "positive"
        assert prob == 0.55

    def test_no_scores_returns_even_low_confidence(self):
        label, prob = SentimentReconciler.reconcile("negative", 0.30)
        assert label == "negative"

    def test_partial_scores_returns_original(self):
        """If only some scores are provided (None mixed in), treat as no scores."""
        label, prob = SentimentReconciler.reconcile("positive", 0.55, food_score=3)
        assert label == "positive"

    # ── High confidence — model wins unconditionally ──────────────────────

    def test_high_confidence_trusts_model_positive(self):
        label, prob = SentimentReconciler.reconcile("positive", 0.95, 2, 2, 2)
        assert label == "positive"
        assert prob == 0.95

    def test_high_confidence_trusts_model_negative(self):
        label, prob = SentimentReconciler.reconcile("negative", 0.80, 5, 5, 5)
        assert label == "negative"

    def test_exactly_at_threshold_trusts_model(self):
        label, prob = SentimentReconciler.reconcile("positive", 0.72, 1, 1, 1)
        assert label == "positive"

    # ── Food veto 1: food ≤ 2 + uncertain model says positive ─────────────

    def test_food_veto_low_food_positive_overrides_to_negative(self):
        """food=2, weighted=2.3 (<2.5) → should be negative."""
        # weighted = 2*0.5 + 2*0.3 + 2*0.2 = 2.0
        label, prob = SentimentReconciler.reconcile("positive", 0.60, 2, 2, 2)
        assert label == "negative"
        assert prob == 0.6

    def test_food_veto_low_food_positive_overrides_to_neutral(self):
        """food=2, high service/price, weighted ≥ 2.5 → neutral not negative."""
        # weighted = 2*0.5 + 5*0.3 + 5*0.2 = 1.0 + 1.5 + 1.0 = 3.5
        label, prob = SentimentReconciler.reconcile("positive", 0.60, 2, 5, 5)
        assert label == "neutral"
        assert prob == 0.6

    def test_food_veto_1_star_food(self):
        # weighted = 1*0.5 + 3*0.3 + 3*0.2 = 0.5+0.9+0.6 = 2.0 (<2.5) → negative
        label, _ = SentimentReconciler.reconcile("positive", 0.55, 1, 3, 3)
        assert label == "negative"

    def test_food_veto_does_not_apply_when_label_is_not_positive(self):
        """Food veto only fires when model says positive. Neutral stays neutral."""
        label, prob = SentimentReconciler.reconcile("neutral", 0.60, 2, 2, 2)
        # weighted = 2.0 → score_label = negative, but text==neutral ≠ positive → goes to score path
        assert label == "negative"

    # ── Food veto 2: food == 3 + uncertain + positive → neutral ───────────

    def test_food_3_uncertain_positive_overrides_to_neutral(self):
        """The bistec tacos scenario: food=3, service=5, price=4 → neutral."""
        label, prob = SentimentReconciler.reconcile("positive", 0.65, 3, 5, 4)
        assert label == "neutral"
        assert prob == 0.6

    def test_food_3_uncertain_negative_not_affected_by_veto(self):
        """Veto 2 only fires when model says positive."""
        # weighted = 3*0.5 + 3*0.3 + 3*0.2 = 3.0 (neutral zone) → goes to score path
        label, _ = SentimentReconciler.reconcile("negative", 0.60, 3, 3, 3)
        # score_label = neutral, text = negative → disagree → score wins
        assert label == "neutral"

    # ── Score-based override when model and scores disagree ───────────────

    def test_score_override_negative_zone(self):
        """Model says positive, scores clearly bad → negative."""
        # weighted = 1*0.5 + 1*0.3 + 1*0.2 = 1.0 (<2.5) → negative
        label, prob = SentimentReconciler.reconcile("positive", 0.55, 1, 1, 1)
        # food=1 triggers veto 1 first
        assert label == "negative"

    def test_score_override_model_neutral_scores_positive(self):
        """Model uncertain + neutral, scores say positive → positive."""
        # weighted = 5*0.5 + 5*0.3 + 5*0.2 = 5.0 (≥3.7) → positive
        label, prob = SentimentReconciler.reconcile("neutral", 0.60, 5, 5, 5)
        assert label == "positive"
        assert prob == 0.6

    def test_score_override_model_positive_scores_negative(self):
        """Model uncertain + says positive, scores in negative zone → negative."""
        # weighted = 1*0.5 + 2*0.3 + 1*0.2 = 1.3 (<2.5) → negative
        # food=1 → veto 1 applies
        label, _ = SentimentReconciler.reconcile("positive", 0.55, 1, 2, 1)
        assert label == "negative"

    def test_score_and_model_agree_keeps_original_prob(self):
        """If model and score-derived label agree, preserve the original probability."""
        # weighted = 4*0.5 + 4*0.3 + 4*0.2 = 4.0 (≥3.7) → positive
        label, prob = SentimentReconciler.reconcile("positive", 0.65, 4, 4, 4)
        assert label == "positive"
        assert prob == 0.65

    def test_score_neutral_zone_boundary_low(self):
        """Exactly at 2.5 threshold — should be neutral, not negative."""
        # weighted = 2.5*0.5 + 2.5*0.3 + 2.5*0.2 = 2.5 (< 3.7, ≥ 2.5) → neutral
        label, _ = SentimentReconciler.reconcile("negative", 0.60, 2.5, 2.5, 2.5)
        assert label == "neutral"

    def test_score_positive_zone_boundary(self):
        """Exactly at 3.7 threshold — should be positive."""
        # weighted = 3.7
        # food=3.7, service=3.7, price=3.7 → 3.7
        label, _ = SentimentReconciler.reconcile("neutral", 0.60, 3.7, 3.7, 3.7)
        assert label == "positive"
