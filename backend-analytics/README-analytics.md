# Analytics Service — Python NLP Intelligence

FastAPI service dedicated to **Spanish sentiment analysis** and gastronomic metric calculation for the campus restaurant review platform.

---

## Architecture

Clean Architecture with four layers:

```
backend-analytics/
├── domain/              # Entities, interfaces, value objects, IGECalculator
├── application/         # Use cases (train, evaluate, predict, snapshots, pipeline)
├── infrastructure/
│   ├── database/        # SQLAlchemy repositories (reviews, model, metrics)
│   └── ml/              # TransformerSentimentPipeline, training data
├── server.py            # FastAPI entry point (persistent service)
├── __main__.py          # CLI entry point (debugging / direct execution)
└── config.py            # Environment config
```

---

## Sentiment Model

**Model:** `pysentimiento/robertuito-sentiment-analysis`
- RoBERTa fine-tuned on ~60M Spanish tweets
- Handles slang, colloquial Spanish, negations, emojis
- No training required — inference only (frozen weights)
- Labels: `POS → positive`, `NEG → negative`, `NEU → neutral`
- Input truncated to 512 tokens

**Configured via:**
```env
TRANSFORMER_MODEL_NAME=pysentimiento/robertuito-sentiment-analysis  # default
```

---

## IGE Metric

Index of Gastronomic Experience — weighted score in the 0–100 range:

| Dimension   | Weight | Description                              |
|-------------|--------|------------------------------------------|
| **Food**    | 50%    | Taste, temperature, presentation         |
| **Service** | 30%    | Wait time, staff kindness, attention     |
| **Price**   | 20%    | Value for money perception               |

Formula: `IGE = (food×0.5 + service×0.3 + price×0.2) × 20`

---

## Setup

### Prerequisites
- Python 3.12+
- Virtual environment

### Installation
```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### Environment (`.env`)
```env
DATABASE_URL=postgresql://...
TRANSFORMER_MODEL_NAME=pysentimiento/robertuito-sentiment-analysis  # optional
MODEL_VERSION=v1.1.0                                                 # optional
LOG_LEVEL=INFO                                                       # optional
```

### Start the server
```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

The model is downloaded from HuggingFace Hub on first startup and cached locally.

### CLI (debugging)
```bash
python -m backend-analytics          # full pipeline (train mode)
echo '{"mode":"predict","review_id":"x","text":"Excelente comida"}' | python __main__.py
```

---

## API Endpoints

### `POST /predict`
Called automatically on every new review submission.

```json
// Request
{ "review_id": "uuid", "text": "Excelente comida, muy recomendable" }

// Response
{ "review_id": "uuid", "label": "positive", "probability": 0.9732, "model_ready": true }
```

### `POST /train`
Full pipeline: loads model, evaluates against training data, classifies all reviews, generates IGE snapshots per establishment. Called by admin via `POST /api/metrics/run`.

```json
// Response
{ "accuracy": 0.87, "f1Score": 0.86, "sentiment_label": "positive", "ige_global": 72.5 }
```

### `GET /health`
```json
{ "status": "ok", "model_loaded": true }
```

> **Contract:** Changing the `/train` response shape requires coordination with `backend-node/src/infrastructure/services/AnalyticsService.ts`.

---

## Tests

```bash
venv\Scripts\python -m pytest tests/unit/ -v
```

113 unit tests, zero external dependencies (all DB and HuggingFace calls are mocked).

| Test file | Coverage |
|---|---|
| `test_transformer_pipeline.py` | `is_loaded`, `load_or_train`, `predict`, `evaluate` |
| `test_predict_single_review.py` | `PredictSingleReviewUseCase` |
| `test_use_cases.py` | `EvaluateModel`, `TrainModel`, `GenerateSnapshots`, `RunPipeline` |
| `test_domain_services.py` | `IGECalculator` |
| `test_entities.py` | Domain entities |
| `test_value_objects.py` | `IGEWeights`, `SentimentLabel` |
| `test_training_data.py` | Dataset integrity |
