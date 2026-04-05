import logging
from typing import List, Tuple

from application.errors import ModelTrainingError
from application.use_cases.evaluate_model import EvaluateModelUseCase
from domain.entities import ModelMetrics
from domain.interfaces import IModelRepository, ISentimentModel

logger = logging.getLogger(__name__)


class TrainModelUseCase:
    """Train (or load from cache) the sentiment model and persist metrics + training run."""

    def __init__(
        self,
        model: ISentimentModel,
        model_repo: IModelRepository,
        evaluate_use_case: EvaluateModelUseCase,
        training_data: List[Tuple[str, str]],
        version: str,
    ) -> None:
        self._model = model
        self._model_repo = model_repo
        self._evaluate_use_case = evaluate_use_case
        self._training_data = training_data
        self._version = version

    def execute(self, force_retrain: bool = False) -> tuple[str, ModelMetrics]:
        """Train model, persist metrics and training run lifecycle.

        Returns (version_id, metrics).
        Resolves Bug 2 (model_versions never got metrics) and
        Bug 3 (training_runs was never populated).
        """
        dataset_size = len(self._training_data)
        logger.info(
            "TrainModelUseCase.execute — version=%s dataset_size=%d force_retrain=%s",
            self._version,
            dataset_size,
            force_retrain,
        )

        version_id = self._model_repo.get_or_create_model_version(self._version, dataset_size)
        run_id = self._model_repo.create_training_run(version_id)  # status = 'running'
        logger.info("Training run created — run_id=%s", run_id)

        try:
            texts = [t for t, _ in self._training_data]
            labels = [lbl for _, lbl in self._training_data]

            self._model.load_or_train(texts, labels, force_retrain)
            metrics = self._evaluate_use_case.execute()

            # Bug Fix 2: persist accuracy/f1/precision/recall into model_versions
            self._model_repo.update_model_metrics(version_id, metrics)
            logger.info(
                "Model metrics persisted — accuracy=%.4f f1=%.4f",
                metrics.accuracy,
                metrics.f1,
            )

            # Bug Fix 3: mark training run as success
            self._model_repo.finish_training_run(run_id, "success")
            logger.info("Training run finished — status=success")

            return version_id, metrics

        except Exception as e:
            # Bug Fix 3: mark training run as failed with error message
            self._model_repo.finish_training_run(run_id, "failed", str(e))
            logger.error("Training run failed — run_id=%s error=%s", run_id, e)
            raise ModelTrainingError(f"Training failed: {e}") from e
