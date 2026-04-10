"""
ExtractNegativeTermsUseCase

Extracts the most frequent significant terms from reviews labeled as negative
for a given establishment. Used to populate the "Alertas Operativas" section
of the manager dashboard.
"""
from __future__ import annotations

import logging
import re
from collections import Counter
from typing import List

logger = logging.getLogger(__name__)

# Common Spanish stopwords that carry no analytical value.
_STOPWORDS: frozenset[str] = frozenset({
    "de", "el", "la", "los", "las", "un", "una", "unos", "unas",
    "que", "en", "y", "a", "es", "se", "no", "lo", "le", "del",
    "con", "por", "para", "pero", "si", "su", "al", "más", "ya",
    "muy", "fue", "son", "hay", "tiene", "tienen", "como", "este",
    "esta", "esto", "todo", "todos", "también", "cuando", "bien",
    "desde", "entre", "hasta", "sobre", "sin", "porque", "me", "te",
    "mi", "tu", "nos", "les", "ni", "o", "e", "u", "he", "ha",
    "han", "hizo", "hacer", "había", "ser", "estar", "era", "este",
    "esa", "eso", "esos", "esas", "esos", "ser", "fue", "fui",
    "pues", "así", "aquí", "allí", "solo", "tan", "vez", "veces",
    "algo", "nada", "poco", "mucho", "bien", "mal", "bueno", "malo",
    "la", "le", "les", "nos", "os", "se", "te", "me", "mi",
    "comida", "lugar", "establecimiento", "restaurante", "vez",
    "pedí", "pedimos", "pedir", "orden", "ordenar",
})

# Minimum character length for a term to be considered meaningful.
_MIN_TERM_LENGTH = 4

# Number of top terms to return.
_TOP_N = 10


class ExtractNegativeTermsUseCase:
    """Extract the most frequent terms from negative reviews of an establishment."""

    @staticmethod
    def execute(
        comments: List[str],
        labels: List[str],
        top_n: int = _TOP_N,
    ) -> List[dict]:
        """Return the top-N most frequent terms found in negative reviews.

        Parameters
        ----------
        comments: List of review comment strings.
        labels:   Corresponding sentiment labels ("positive"/"negative"/"neutral").
        top_n:    How many terms to return (default 10).

        Returns
        -------
        List of dicts sorted by mentions descending:
            [{"term": "frío", "mentions": 5}, ...]
        """
        negative_comments = [
            c for c, label in zip(comments, labels) if label == "negative"
        ]

        if not negative_comments:
            logger.debug("extract_negative_terms: no negative comments found")
            return []

        counter: Counter = Counter()
        for comment in negative_comments:
            tokens = _tokenize(comment)
            counter.update(tokens)

        top_terms = [
            {"term": term, "mentions": count}
            for term, count in counter.most_common(top_n)
        ]

        logger.info(
            "extract_negative_terms: %d negative comments → top %d terms",
            len(negative_comments),
            len(top_terms),
        )
        return top_terms


def _tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, remove stopwords and short tokens."""
    # Normalize: lowercase, remove accents equivalent chars, strip punctuation
    text = text.lower()
    # Remove punctuation and special chars, keep letters and spaces
    text = re.sub(r"[^a-záéíóúüñ\s]", " ", text)
    tokens = text.split()
    return [
        t for t in tokens
        if len(t) >= _MIN_TERM_LENGTH and t not in _STOPWORDS
    ]
