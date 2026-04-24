"""
API-layer tests for the FastAPI server (server.py).

These tests exercise HTTP endpoints via TestClient with all heavy
dependencies (DB, ML model) replaced by mocks.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

import server as server_module
from server import app

# ── Fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def mock_deps():
    """Dependency dict that replaces _build_deps() output."""
    model = MagicMock()
    model.is_loaded.return_value = True
    return {
        "model": model,
        "review_repo": MagicMock(),
        "model_repo": MagicMock(),
        "metrics_repo": MagicMock(),
    }


@pytest.fixture
def client_open(mock_deps):
    """TestClient with no API key configured (open / dev mode)."""
    with (
        patch.object(server_module, "_build_deps", return_value=mock_deps),
        patch.object(server_module, "config") as mock_config,
    ):
        mock_config.ANALYTICS_API_KEY = ""
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c, mock_deps


@pytest.fixture
def client_secured(mock_deps):
    """TestClient with API key = 'test-key-123'."""
    with (
        patch.object(server_module, "_build_deps", return_value=mock_deps),
        patch.object(server_module, "config") as mock_config,
    ):
        mock_config.ANALYTICS_API_KEY = "test-key-123"
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c, mock_deps


# ── GET /health ──────────────────────────────────────────────────────────

class TestHealth:

    def test_returns_ok_status(self, client_open):
        client, _ = client_open
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_model_loaded_true(self, client_open):
        client, deps = client_open
        deps["model"].is_loaded.return_value = True
        resp = client.get("/health")
        assert resp.json()["model_loaded"] is True

    def test_model_loaded_false(self, client_open):
        client, deps = client_open
        deps["model"].is_loaded.return_value = False
        resp = client.get("/health")
        assert resp.json()["model_loaded"] is False

    def test_health_does_not_require_api_key(self, client_secured):
        client, _ = client_secured
        resp = client.get("/health")
        assert resp.status_code == 200


# ── POST /predict — open mode ───────────────────────────────────────────

class TestPredictOpen:

    _VALID_BODY = {"review_id": "rev-1", "text": "Excelente comida"}

    def test_valid_request_returns_200(self, client_open):
        client, _ = client_open
        with patch(
            "application.use_cases.predict_single_review.PredictSingleReviewUseCase"
        ) as MockUC:
            MockUC.return_value.execute.return_value = {
                "review_id": "rev-1",
                "label": "positive",
                "probability": 0.92,
                "model_ready": True,
            }
            resp = client.post("/predict", json=self._VALID_BODY)
        assert resp.status_code == 200
        assert resp.json()["label"] == "positive"

    def test_use_case_receives_scores(self, client_open):
        client, _ = client_open
        body = {**self._VALID_BODY, "food_score": 5.0, "service_score": 4.0, "price_score": 3.0}
        with patch(
            "application.use_cases.predict_single_review.PredictSingleReviewUseCase"
        ) as MockUC:
            MockUC.return_value.execute.return_value = {
                "review_id": "rev-1",
                "label": "positive",
                "probability": 0.9,
                "model_ready": True,
            }
            resp = client.post("/predict", json=body)
        assert resp.status_code == 200
        call_kwargs = MockUC.return_value.execute.call_args
        assert call_kwargs[1]["food_score"] == 5.0
        assert call_kwargs[1]["service_score"] == 4.0
        assert call_kwargs[1]["price_score"] == 3.0

    def test_missing_review_id_returns_422(self, client_open):
        client, _ = client_open
        resp = client.post("/predict", json={"text": "algo"})
        assert resp.status_code == 422

    def test_missing_text_returns_422(self, client_open):
        client, _ = client_open
        resp = client.post("/predict", json={"review_id": "rev-1"})
        assert resp.status_code == 422

    def test_empty_body_returns_422(self, client_open):
        client, _ = client_open
        resp = client.post("/predict", json={})
        assert resp.status_code == 422

    def test_use_case_exception_returns_500(self, client_open):
        client, _ = client_open
        with patch(
            "application.use_cases.predict_single_review.PredictSingleReviewUseCase"
        ) as MockUC:
            MockUC.return_value.execute.side_effect = RuntimeError("model exploded")
            resp = client.post("/predict", json=self._VALID_BODY)
        assert resp.status_code == 500


# ── POST /predict — secured mode ────────────────────────────────────────

class TestPredictSecured:

    _VALID_BODY = {"review_id": "rev-1", "text": "Buena comida"}

    def test_missing_api_key_returns_401(self, client_secured):
        client, _ = client_secured
        resp = client.post("/predict", json=self._VALID_BODY)
        assert resp.status_code == 401

    def test_wrong_api_key_returns_401(self, client_secured):
        client, _ = client_secured
        resp = client.post(
            "/predict",
            json=self._VALID_BODY,
            headers={"X-API-Key": "wrong-key"},
        )
        assert resp.status_code == 401

    def test_correct_api_key_returns_200(self, client_secured):
        client, _ = client_secured
        with patch(
            "application.use_cases.predict_single_review.PredictSingleReviewUseCase"
        ) as MockUC:
            MockUC.return_value.execute.return_value = {
                "review_id": "rev-1",
                "label": "positive",
                "probability": 0.9,
                "model_ready": True,
            }
            resp = client.post(
                "/predict",
                json=self._VALID_BODY,
                headers={"X-API-Key": "test-key-123"},
            )
        assert resp.status_code == 200


# ── POST /train — open mode ─────────────────────────────────────────────

class TestTrainOpen:

    def test_returns_200_and_calls_pipeline(self, client_open):
        client, _ = client_open
        with (
            patch("application.use_cases.run_pipeline.RunPipelineUseCase") as MockRun,
            patch("application.use_cases.generate_snapshots.GenerateMetricsSnapshotsUseCase"),
        ):
            MockRun.return_value.execute.return_value = {
                "classified": 50,
                "snapshots": 4,
                "accuracy": 0.85,
            }
            resp = client.post("/train", json={})
        assert resp.status_code == 200
        assert resp.json()["classified"] == 50
        MockRun.return_value.execute.assert_called_once()

    def test_pipeline_failure_returns_500(self, client_open):
        client, _ = client_open
        with (
            patch("application.use_cases.run_pipeline.RunPipelineUseCase") as MockRun,
            patch("application.use_cases.generate_snapshots.GenerateMetricsSnapshotsUseCase"),
        ):
            MockRun.return_value.execute.side_effect = RuntimeError("DB connection lost")
            resp = client.post("/train", json={})
        assert resp.status_code == 500
        assert "DB connection lost" in resp.json()["detail"]


# ── POST /train — secured mode ──────────────────────────────────────────

class TestTrainSecured:

    def test_missing_api_key_returns_401(self, client_secured):
        client, _ = client_secured
        resp = client.post("/train", json={})
        assert resp.status_code == 401

    def test_correct_api_key_returns_200(self, client_secured):
        client, _ = client_secured
        with (
            patch("application.use_cases.run_pipeline.RunPipelineUseCase") as MockRun,
            patch("application.use_cases.generate_snapshots.GenerateMetricsSnapshotsUseCase"),
        ):
            MockRun.return_value.execute.return_value = {"classified": 10, "snapshots": 2}
            resp = client.post(
                "/train",
                json={},
                headers={"X-API-Key": "test-key-123"},
            )
        assert resp.status_code == 200
