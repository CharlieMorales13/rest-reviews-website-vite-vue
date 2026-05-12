"""Unit tests for ExtractNegativeTermsUseCase."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from application.use_cases.extract_negative_terms import ExtractNegativeTermsUseCase


class TestExtractNegativeTermsUseCase:

    def test_returns_empty_when_no_negative_comments(self):
        comments = ["Excelente comida", "Muy bueno"]
        labels = ["positive", "positive"]
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        assert result == []

    def test_returns_empty_with_single_negative_comment(self):
        """One negative review is not enough to surface terms (noise prevention)."""
        comments = ["El café llegó frío y el lugar estaba sucio", "Rica comida"]
        labels = ["negative", "positive"]
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        assert result == []

    def test_returns_terms_appearing_in_multiple_reviews(self):
        comments = [
            "El café llegó frío y el servicio fue horrible",
            "Servicio horrible, café frío, no regreso",
            "Todo bien, rico desayuno",
        ]
        labels = ["negative", "negative", "positive"]
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        terms = [r["term"] for r in result]
        # "café frío" appears in both negative reviews → should surface
        assert any("café" in t or "frio" in t or "frío" in t for t in terms)
        # All returned terms must have mentions >= 2
        assert all(r["mentions"] >= 2 for r in result)

    def test_returns_empty_when_terms_dont_repeat_across_reviews(self):
        """Each negative review uses unique words → no term reaches min frequency."""
        comments = [
            "Insecto horrible encontré dentro",
            "Servicio tardísimo esperamos mucho",
        ]
        labels = ["negative", "negative"]
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        assert result == []

    def test_respects_top_n(self):
        negative = "comida fría horrible servicio lento tardaron mucho"
        comments = [negative] * 5
        labels = ["negative"] * 5
        result = ExtractNegativeTermsUseCase.execute(comments, labels, top_n=3)
        assert len(result) <= 3

    def test_result_sorted_descending_by_mentions(self):
        # "comida fría" appears in 3 reviews, "servicio lento" in 2
        comments = [
            "comida fría servicio lento",
            "comida fría espantoso",
            "comida fría lugar sucio",
            "servicio lento tardaron",
        ]
        labels = ["negative"] * 4
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        mentions = [r["mentions"] for r in result]
        assert mentions == sorted(mentions, reverse=True)

    def test_term_counted_once_per_review_not_per_occurrence(self):
        """A term repeated twice within one review must count as 1 review, not 2."""
        comments = [
            "frío frío todo está muy frío",  # "frío" appears 3x in one review
            "llegó frío el pedido",
        ]
        labels = ["negative", "negative"]
        result = ExtractNegativeTermsUseCase.execute(comments, labels)
        # "frío" should appear with mentions=2 (two distinct reviews), not 4
        frio_terms = [r for r in result if "frío" in r["term"] or "frio" in r["term"]]
        for t in frio_terms:
            assert t["mentions"] == 2

    def test_empty_comments_list(self):
        assert ExtractNegativeTermsUseCase.execute([], []) == []
