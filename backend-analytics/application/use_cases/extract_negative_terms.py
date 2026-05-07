"""
ExtractNegativeTermsUseCase

Extracts the most frequent significant BIGRAMS from reviews labeled as negative.
Bigrams ("comida fría", "servicio lento") are far more actionable than isolated words.
Falls back to meaningful unigrams when insufficient bigrams are found per comment.
"""
from __future__ import annotations

import logging
import re
from collections import Counter
from typing import List

logger = logging.getLogger(__name__)

# Common Spanish stopwords and verb forms that carry no standalone analytical value.
_STOPWORDS: frozenset[str] = frozenset({
    # Articles, prepositions, conjunctions
    "de", "el", "la", "los", "las", "un", "una", "unos", "unas",
    "que", "en", "y", "a", "es", "se", "no", "lo", "le", "del",
    "con", "por", "para", "pero", "si", "su", "al", "más", "ya",
    "muy", "son", "hay", "como", "este", "esta", "esto", "todo",
    "todos", "también", "cuando", "bien", "desde", "entre", "hasta",
    "sobre", "sin", "porque", "me", "te", "mi", "tu", "nos", "les",
    "ni", "o", "e", "u", "he", "ha", "han", "pues", "así", "aquí",
    "allí", "solo", "tan", "vez", "veces", "algo", "nada", "poco",
    "mucho", "bueno", "malo", "la", "os",
    # Common verbs (non-actionable in isolation)
    "fue", "fui", "fue", "ser", "estar", "era", "hizo", "hacer",
    "había", "tiene", "tienen", "tuvo", "tuve", "estaba", "estaban",
    "llegó", "llegué", "llegamos", "tardaron", "tardé", "tardó",
    "estuvo", "estuvieron", "fueron", "pedí", "pedimos", "pedir",
    "ordenar", "recibí", "recibimos", "dijo", "dijeron",
    # Domain-specific noise
    "comida", "lugar", "establecimiento", "restaurante",
    "orden", "mesa",
})

_MIN_TERM_LENGTH = 4
_TOP_N = 10
_MIN_REVIEW_FREQUENCY = 2  # term must appear in at least this many distinct reviews


class ExtractNegativeTermsUseCase:
    """Extract the most frequent bigrams from negative reviews of an establishment."""

    @staticmethod
    def execute(
        comments: List[str],
        labels: List[str],
        top_n: int = _TOP_N,
    ) -> List[dict]:
        """Return top-N bigrams that appear in at least _MIN_REVIEW_FREQUENCY distinct
        negative reviews. Falls back to unigrams for comments with no bigrams.
        Returns empty list when there are fewer negative reviews than the threshold.
        """
        negative_comments = [
            c for c, label in zip(comments, labels) if label == "negative"
        ]

        if len(negative_comments) < _MIN_REVIEW_FREQUENCY:
            logger.debug(
                "extract_negative_terms: only %d negative comment(s) — "
                "need at least %d to surface meaningful terms",
                len(negative_comments),
                _MIN_REVIEW_FREQUENCY,
            )
            return []

        # Count in how many distinct reviews each term appears
        review_frequency: Counter = Counter()
        for comment in negative_comments:
            tokens = _tokenize(comment)
            bigrams = _extract_bigrams(tokens)
            terms = bigrams if bigrams else tokens
            # Use a set so a term repeated within one review counts only once
            review_frequency.update(set(terms))

        top_terms = [
            {"term": term, "mentions": count}
            for term, count in review_frequency.most_common(top_n)
            if count >= _MIN_REVIEW_FREQUENCY
        ]

        logger.info(
            "extract_negative_terms: %d negative comments → top %d terms (min %d reviews)",
            len(negative_comments),
            len(top_terms),
            _MIN_REVIEW_FREQUENCY,
        )
        return top_terms


def _tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, remove stopwords and short tokens."""
    text = text.lower()
    text = re.sub(r"[^a-záéíóúüñ\s]", " ", text)
    tokens = text.split()
    return [
        t for t in tokens
        if len(t) >= _MIN_TERM_LENGTH and t not in _STOPWORDS
    ]


def _extract_bigrams(tokens: List[str]) -> List[str]:
    """Generate adjacent bigrams where BOTH tokens survive the stopword filter."""
    bigrams = []
    for i in range(len(tokens) - 1):
        w1, w2 = tokens[i], tokens[i + 1]
        if (w1 not in _STOPWORDS and w2 not in _STOPWORDS
                and len(w1) >= _MIN_TERM_LENGTH and len(w2) >= _MIN_TERM_LENGTH):
            bigrams.append(f"{w1} {w2}")
    return bigrams
