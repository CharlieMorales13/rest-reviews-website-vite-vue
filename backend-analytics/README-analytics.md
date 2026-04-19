# Analytics Service — Python NLP Intelligence

FastAPI service dedicated to **Spanish sentiment analysis** and gastronomic metric calculation for the campus restaurant review platform.

---

## Architecture

Clean Architecture with three layers:

```
backend-analytics/
├── domain/              # Entities, interfaces, value objects, IGECalculator, SentimentReconciler
├── application/         # Use cases (predict, train/evaluate, snapshots, pipeline)
├── infrastructure/
│   ├── database/        # SQLAlchemy repositories (reviews, model, metrics)
│   └── ml/              # TransformerSentimentPipeline, evaluation dataset
├── server.py            # FastAPI entry point
└── config.py            # Environment config (DATABASE_URL, API key, model name)
```

---

## Sentiment Model

**Model:** `pysentimiento/robertuito-sentiment-analysis`
- RoBERTa fine-tuned on ~60M Spanish tweets
- Handles slang, colloquial Spanish, negations, emojis
- Inference only — weights are frozen, no retraining
- Labels: `POS → positive`, `NEG → negative`, `NEU → neutral`
- Input truncated to 512 tokens
- Downloaded from HuggingFace Hub on first startup and cached locally

**Configured via:**
```env
TRANSFORMER_MODEL_NAME=pysentimiento/robertuito-sentiment-analysis  # default
```

---

## SentimentReconciler

Combines transformer confidence with explicit star-rating signals to correct low-confidence predictions.

**Two-layer override strategy:**

1. **High confidence (≥ 0.72)** → trust the model unconditionally, return as-is.
2. **Low confidence** → derive label from IGE-weighted scores, then apply food-quality veto rules:
   - `food ≤ 2` + model says `positive` → override to `negative` or `neutral`
   - `food ≤ 2` + model says `neutral` → override to `negative`

| Weighted score threshold | Derived label |
|--------------------------|---------------|
| `weighted < 2.5`         | `negative`    |
| `2.5 ≤ weighted < 3.7`  | `neutral`     |
| `weighted ≥ 3.7`         | `positive`    |

`weighted = food×0.5 + service×0.3 + price×0.2`

The reconciler only activates when all three scores are provided. If any score is absent, the raw transformer output is returned unchanged.

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
- Python 3.8+
- Virtual environment

### Installation
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

### Environment (`.env`)
```env
DATABASE_URL=postgresql://...
ANALYTICS_API_KEY=<secret>                                           # required — protects /predict and /train
TRANSFORMER_MODEL_NAME=pysentimiento/robertuito-sentiment-analysis  # optional
MODEL_VERSION=v1.1.0                                                 # optional
LOG_LEVEL=INFO                                                       # optional
```

### Start the server
```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

---

## API Endpoints

### `POST /predict`
Protected by `X-API-Key` header. Called automatically by the Node backend on every new review submission.

```json
// Request
{
  "review_id": "uuid",
  "text": "Excelente comida, muy recomendable",
  "food_score": 5,
  "service_score": 4,
  "price_score": 3
}

// Response
{ "review_id": "uuid", "label": "positive", "probability": 0.9732, "model_ready": true }
```

`food_score`, `service_score`, and `price_score` are optional. When provided they feed the `SentimentReconciler` to correct low-confidence predictions.

### `POST /train`
Protected by `X-API-Key` header. Full pipeline: evaluates model against training data, classifies all reviews, generates IGE snapshots per establishment. Called by admin via `POST /api/metrics/run` on the Node backend.

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

## Security

`/predict` and `/train` require the `X-API-Key` header matching `ANALYTICS_API_KEY` from the environment. Requests without a valid key receive `403 Forbidden`. `/health` is public.

---

## Tests

```bash
# Activate venv first
venv\Scripts\python -m pytest tests/unit/ -v     # Windows
python -m pytest tests/unit/ -v                  # Linux/Mac
```

118 unit tests, zero external dependencies (all DB and HuggingFace calls are mocked).

| Test file | What it covers |
|---|---|
| `test_transformer_pipeline.py` | `is_loaded`, `load_or_train`, `predict`, `evaluate` |
| `test_predict_single_review.py` | `PredictSingleReviewUseCase` — model ready and not ready paths |
| `test_sentiment_reconciler.py` | `SentimentReconciler` — all override rules and edge cases |
| `test_use_cases.py` | `EvaluateModel`, `TrainModel`, `GenerateSnapshots`, `RunPipeline` |
| `test_domain_services.py` | `IGECalculator` |
| `test_entities.py` | Domain entities |
| `test_value_objects.py` | `IGEWeights`, `SentimentLabel` |
| `test_training_data.py` | Dataset integrity |

**Patching note:** HuggingFace `transformers` uses a lazy-loader (`_LazyModule`). Always patch at the import site, not at the source package:
```python
# Correct
@patch("infrastructure.ml.transformer_pipeline.hf_pipeline")

# Wrong — does not intercept the lazy module
@patch("transformers.pipeline")
```
