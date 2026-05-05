# Anáhuac Eats — Backend Analytics

Servicio de análisis de sentimiento en español y cálculo de métricas gastronómicas. Expuesto como API HTTP con **FastAPI** y modelo transformer **RoBERTa**.

---

## Stack

| Tecnología | Uso |
|---|---|
| Python 3.10+ | Runtime |
| FastAPI + Uvicorn | Framework HTTP async |
| PyTorch + Transformers | Inferencia del modelo NLP |
| SQLAlchemy 2.0 | Acceso a base de datos |
| Pydantic | Validación de esquemas |
| pytest + pytest-cov | Tests y cobertura |
| ruff | Linter |

---

## Arquitectura — Clean Architecture

```
backend-analytics/
├── domain/
│   ├── entities/            # Review, MetricsSnapshot, ModelVersion
│   ├── repositories/        # Interfaces (IReviewRepository, etc.)
│   └── services/            # IGECalculator, SentimentReconciler, IGEWeights
├── application/
│   └── use_cases/           # PredictSingleReview, EvaluateModel, TrainModel,
│                            # GenerateSnapshots, RunPipeline
├── infrastructure/
│   ├── database/            # SQLAlchemy repositories
│   └── ml/                  # TransformerSentimentPipeline, training_data.py
├── server.py                # FastAPI entry point
└── config.py                # Variables de entorno
```

---

## Modelo de sentimiento

**Modelo:** `pysentimiento/robertuito-sentiment-analysis`

- RoBERTa fine-tuned en ~60M tweets en español
- Maneja slang, español coloquial, negaciones, emojis
- Solo inferencia — pesos congelados, sin reentrenamiento
- Labels: `POS → positive`, `NEG → negative`, `NEU → neutral`
- Entrada truncada a 512 tokens
- Descargado de HuggingFace Hub en el primer inicio y cacheado localmente

---

## SentimentReconciler

Combina la confianza del transformer con las calificaciones de estrellas para corregir predicciones de baja confianza.

**Estrategia de override:**

1. **Alta confianza (≥ 0.72)** → confía en el modelo incondicionalmente.
2. **Baja confianza** → deriva la etiqueta desde el IGE ponderado, luego aplica veto de calidad de comida:
   - `food ≤ 2` + modelo dice `positive` → override a `negative` o `neutral`
   - `food ≤ 2` + modelo dice `neutral` → override a `negative`

| Score ponderado | Etiqueta derivada |
|---|---|
| `< 2.5` | `negative` |
| `2.5 – 3.7` | `neutral` |
| `≥ 3.7` | `positive` |

`weighted = food×0.5 + service×0.3 + price×0.2`

Solo activa cuando los tres scores están presentes.

---

## IGE — Índice de Experiencia Gastronómica

Puntuación ponderada en rango 0–100:

| Dimensión | Peso | Descripción |
|---|---|---|
| Comida | 50% | Sabor, temperatura, presentación |
| Servicio | 30% | Tiempo de espera, atención del personal |
| Precio | 20% | Percepción de valor por dinero |

`IGE = (food×0.5 + service×0.3 + price×0.2) × 20`

---

## Variables de entorno

Crea `backend-analytics/.env` desde `backend-analytics/.env.example`:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión Supabase (pooler en producción) |
| `ANALYTICS_API_KEY` | Clave que protege `/predict` y `/train` |
| `TRANSFORMER_MODEL_NAME` | Nombre del modelo HuggingFace (opcional) |
| `MODEL_VERSION` | Versión del modelo (opcional) |
| `LOG_LEVEL` | Nivel de logging: `INFO`, `DEBUG` (opcional) |

**Nunca commitees `.env`.**

---

## Instalación

```bash
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

---

## Desarrollo local

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

---

## API Endpoints

### `POST /predict`

Protegido por `X-API-Key`. Llamado automáticamente por el backend Node en cada nueva reseña.

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

### `POST /train`

Protegido por `X-API-Key`. Pipeline completo: evalúa el modelo, clasifica todas las reseñas y genera snapshots IGE. Llamado por admin vía `POST /api/metrics/run` en el backend Node, y automáticamente cada noche a las 2:00 AM.

```json
// Response
{ "accuracy": 0.87, "f1Score": 0.86, "sentiment_label": "positive", "ige_global": 72.5 }
```

### `GET /health`

```json
{ "status": "ok", "model_loaded": true }
```

> **Contrato:** cambiar la forma del response de `/train` requiere actualizar `backend-node/src/infrastructure/services/AnalyticsService.ts`.

---

## Tests

```bash
# Linux/Mac
python -m pytest tests/ -v

# Windows
venv\Scripts\python -m pytest tests/ -v
```

~135 tests (unitarios + API). Sin dependencias externas — DB y HuggingFace mockeados.

| Directorio | Qué cubre |
|---|---|
| `tests/unit/` | Dominio, use cases, ML pipeline |
| `tests/api/` | Endpoints FastAPI |

**Nota de patching:** HuggingFace `transformers` usa un lazy-loader (`_LazyModule`). Siempre parchear en el sitio de importación:

```python
# Correcto
@patch("infrastructure.ml.transformer_pipeline.hf_pipeline")

# Incorrecto — no intercepta el lazy module
@patch("transformers.pipeline")
```

---

## Git workflow

Ver [flujo completo en el README raíz](../README.md#git-workflow). Resumen para este servicio:

```bash
git checkout -b feat/analytics-mi-feature
# desarrollar + tests en el mismo commit
git commit -m "feat(analytics): agregar endpoint de tendencias temporales"
git push origin feat/analytics-mi-feature
```

Scopes frecuentes en analytics: `analytics`, `metrics`, `sentiment`.
