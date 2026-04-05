import logging
from collections import Counter
from typing import List, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline

from domain.entities import ModelMetrics, SentimentPrediction
from domain.interfaces import ISentimentModel
from domain.services import TextNormalizer
from infrastructure.ml.model_persistence import load_model, save_model
from infrastructure.ml.stop_words import SPANISH_STOP_WORDS


class SklearnSentimentPipeline(ISentimentModel):
    """Scikit-learn TF-IDF + Logistic Regression sentiment classifier."""

    def __init__(self, model_path: str) -> None:
        self._model_path = model_path
        self._pipeline: Optional[Pipeline] = None
        self._logger = logging.getLogger(self.__class__.__name__)

    # ------------------------------------------------------------------ #
    # ISentimentModel implementation                                       #
    # ------------------------------------------------------------------ #

    def load_or_train(
        self,
        texts: List[str],
        labels: List[str],
        force_retrain: bool = False,
    ) -> None:
        """Load a cached model from disk or train a new one.

        If *force_retrain* is True, always trains a fresh pipeline regardless
        of whether a cached artefact exists on disk.
        """
        if not force_retrain:
            cached = load_model(self._model_path)
            if cached is not None:
                self._pipeline = cached
                self._logger.info("Loaded cached model from %s", self._model_path)
                return

        self._logger.info(
            "Training new model on %d samples (force_retrain=%s)",
            len(texts),
            force_retrain,
        )

        normalized_texts = [TextNormalizer.normalize(t) for t in texts]

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=2000,
                ngram_range=(1, 3),       # trigramas capturan "no me gusto"
                sublinear_tf=True,         # log(1+tf) reduce dominio de palabras frecuentes
                min_df=2,                  # elimina hapax legomena
                stop_words=SPANISH_STOP_WORDS,
            )),
            ("clf", LogisticRegression(
                random_state=42,
                class_weight="balanced",
                max_iter=1000,
                solver="lbfgs",
                C=1.0,
            )),
        ])

        pipeline.fit(normalized_texts, labels)
        self._pipeline = pipeline
        save_model(pipeline, self._model_path)
        self._logger.info("Model trained and saved to %s", self._model_path)

    def predict(self, texts: List[str]) -> List[SentimentPrediction]:
        """Return sentiment predictions for *texts*.

        Empty texts receive label "neutral" with probability 0.0.
        review_id is set to "" — the caller is responsible for assigning IDs.
        """
        if self._pipeline is None:
            raise RuntimeError(
                "Pipeline is not loaded. Call load_or_train() before predict()."
            )

        results: List[SentimentPrediction] = []

        # Normalise and track empty-text indices
        normalized: List[str] = []
        empty_indices: set = set()
        for idx, text in enumerate(texts):
            norm = TextNormalizer.normalize(text)
            if not norm:
                empty_indices.add(idx)
                normalized.append("")
            else:
                normalized.append(norm)

        # Only run sklearn on non-empty texts
        non_empty_norm = [t for i, t in enumerate(normalized) if i not in empty_indices]
        non_empty_positions = [i for i in range(len(texts)) if i not in empty_indices]

        ne_map: dict = {}
        if non_empty_norm:
            pred_labels = self._pipeline.predict(non_empty_norm)
            pred_probas = self._pipeline.predict_proba(non_empty_norm)
            classes = list(self._pipeline.classes_)
            for pos, label, proba in zip(non_empty_positions, pred_labels, pred_probas):
                max_prob = float(proba[classes.index(label)])
                ne_map[pos] = (label, max_prob)

        for idx in range(len(texts)):
            if idx in empty_indices:
                results.append(SentimentPrediction(
                    review_id="",
                    label="neutral",
                    probability=0.0,
                ))
            else:
                label, prob = ne_map[idx]
                results.append(SentimentPrediction(
                    review_id="",
                    label=label,
                    probability=prob,
                ))

        return results

    def evaluate(self, texts: List[str], labels: List[str]) -> ModelMetrics:
        """Train on 80 % of the data, evaluate on the remaining 20 %.

        Also computes stratified k-fold cross-validation on the full dataset.
        The k is clamped to min(5, smallest_class_count) to avoid splits with
        fewer samples than folds.
        """
        if self._pipeline is None:
            raise RuntimeError(
                "Pipeline is not loaded. Call load_or_train() before evaluate()."
            )

        normalized = [TextNormalizer.normalize(t) for t in texts]

        X_train, X_test, y_train, y_test = train_test_split(
            normalized,
            labels,
            test_size=0.2,
            random_state=42,
            stratify=labels,
        )

        # Fit a fresh copy for evaluation so we don't overwrite the cached model.
        # min_df=1 here (not 2) so the eval split keeps a full vocabulary even
        # when the train portion is only ~80 % of a small dataset.
        eval_pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=2000,
                ngram_range=(1, 3),
                sublinear_tf=True,
                min_df=1,
                stop_words=SPANISH_STOP_WORDS,
            )),
            ("clf", LogisticRegression(
                random_state=42,
                class_weight="balanced",
                max_iter=1000,
                solver="lbfgs",
                C=1.0,
            )),
        ])
        eval_pipeline.fit(X_train, y_train)
        y_pred = eval_pipeline.predict(X_test)

        accuracy = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        precision = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        recall = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))

        # Cross-validation — cap k at the smallest class count
        min_class_count = min(Counter(labels).values())
        k = min(5, min_class_count)

        cv_pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=2000,
                ngram_range=(1, 3),
                sublinear_tf=True,
                min_df=1,
                stop_words=SPANISH_STOP_WORDS,
            )),
            ("clf", LogisticRegression(
                random_state=42,
                class_weight="balanced",
                max_iter=1000,
                solver="lbfgs",
                C=1.0,
            )),
        ])
        cv_scores = cross_val_score(cv_pipeline, normalized, labels, cv=k, scoring="accuracy")
        cv_mean = float(np.mean(cv_scores))
        cv_std = float(np.std(cv_scores))

        self._logger.info(
            "Evaluation complete — accuracy=%.4f f1=%.4f cv_mean=%.4f±%.4f (k=%d)",
            accuracy, f1, cv_mean, cv_std, k,
        )

        return ModelMetrics(
            accuracy=accuracy,
            f1=f1,
            precision=precision,
            recall=recall,
            cv_mean=cv_mean,
            cv_std=cv_std,
            dataset_size=len(texts),
        )
