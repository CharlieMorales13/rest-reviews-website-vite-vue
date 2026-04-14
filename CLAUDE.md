# CLAUDE.md — Guía del proyecto

Plataforma de reseñas de restaurantes universitarios para el campus Anáhuac Oaxaca.
Establecimientos: DelyFull, Guajaquenito, Cuckoo Coffee & Resto, Cuckoo Box.

---

## Arquitectura general

Tres servicios independientes:

| Servicio | Ruta | Puerto | Tecnología |
|---|---|---|---|
| Frontend | `frontend/` | 5173 | Vue 3 + Vite + TypeScript |
| Backend Node | `backend-node/` | 3000 | Express + TypeScript + Prisma |
| Backend Analytics | `backend-analytics/` | 8001 | FastAPI + Python |
| Base de datos | — | — | Supabase (PostgreSQL) |

**Patrón:** Clean Architecture en Node y Analytics. Feature-Sliced Design (FSD) en Frontend.
**DI:** tsyringe en Node (`@injectable`, `@inject`). Tokens registrados en `container.ts`.

---

## Comandos de desarrollo

```bash
# Backend Node
cd backend-node && npm run dev

# Backend Analytics (FastAPI — modelo de sentimiento)
cd backend-analytics
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # Linux/Mac
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd frontend && npm run dev
```

---

## Base de datos — Supabase

**IMPORTANTE:** `prisma db push` se cuelga frecuentemente con el pooler de Supabase.

Flujo correcto para cambios de schema:
1. Aplicar el DDL directamente en **Supabase Dashboard → SQL Editor**
2. Ejecutar `npx prisma generate` localmente para regenerar el cliente
3. No usar `prisma db push` en este proyecto

Para cambios en `schema.prisma`: editar el archivo, aplicar el SQL equivalente en Supabase, luego `npx prisma generate`.

---

## Commits

Formato conventional commits, una sola línea, sin body ni Co-Authored-By:

```
feat(scope): descripción corta
fix(scope): descripción corta
refactor(scope): descripción corta
```

Scopes comunes: `establishments`, `reviews`, `analytics`, `dashboard`, `profile`, `admin`, `auth`.

---

## Credenciales de prueba

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@anahuac.mx` | `Admin2026!` |
| Manager | `memo@anahuac.mx` | `memomemo` |
| Student | `carlos.gomez@anahuac.mx` | `carloscarlos` |

---

## Backend Node — estructura clave

```
backend-node/src/
  domain/
    entities/          # Establishment, Review, User, MetricsSnapshot
    repositories/      # Interfaces (IEstablishmentRepository, etc.)
  application/
    use-cases/         # Un archivo por caso de uso
    dtos/              # Zod schemas + tipos
  infrastructure/
    database/          # PrismaXxxRepository (implementaciones)
    http/
      controllers/     # Un controller por entidad
      routes/          # establishment.routes.ts, review.routes.ts, etc.
      middlewares/     # AuthMiddleware, RateLimitMiddleware
    services/          # AnalyticsService.ts (HTTP client → FastAPI)
```

**Rutas públicas de establecimientos usan slug** (no UUID):
- `GET /establishments/:slug`
- `GET /establishments/:slug/reviews`

Las rutas protegidas (`PUT`, `DELETE`) siguen usando UUID.

---

## Frontend — estructura clave

```
frontend/src/
  app/router/index.ts        # Rutas — params nombrados: :slug, no :id para establecimientos
  entities/review/
    api/ReviewService.ts     # getEstablishment(slug), getEstablishmentReviews(slug, ...)
    model/types.ts           # Establishment incluye slug?: string
  pages/
    establishments/          # EstablishmentsPage, EstablishmentDetailsPage
    dashboard/               # StudentDashboard, ManagerDashboard, AdminDashboard
    create-review/           # CreateReviewPage — resuelve slug → UUID para POST
    profile/                 # ProfilePage, EditProfileModal, MyReviewsPage
```

**Navegación por slug:** Todos los `router.push` a `/establishments/` usan `est.slug`, no `est.id`.
`CreateReviewPage` resuelve el slug al UUID real antes de llamar `ReviewService.create`.

---

## Backend Analytics — arquitectura

**Modelo:** `pysentimiento/robertuito-sentiment-analysis` (RoBERTa, tweets en español).
Solo inferencia — no se re-entrena con datos nuevos.

**Capas:**
```
backend-analytics/
  domain/           # entities, IGECalculator, IGEWeights, SentimentReconciler
  application/      # use cases: Predict, Train, Evaluate, GenerateSnapshots, RunPipeline
  infrastructure/
    database/       # SQLAlchemy repos
    ml/             # TransformerSentimentPipeline, training_data.py
  server.py         # FastAPI: POST /predict, POST /train, GET /health
  __main__.py       # CLI para debugging
```

**SentimentReconciler:** Combina confianza del transformer con calificaciones de estrellas.
- Confianza ≥ 0.72 → confía en el modelo
- food ≤ 2 + modelo positivo → override a negativo/neutral
- Usa pesos IGE (food×0.5 + service×0.3 + price×0.2) cuando hay discrepancia

**IGE (Índice de Experiencia Gastronómica):**
- Food Quality: 50%
- Service Quality: 30%
- Pricing Value: 20%

**Pipeline completo:** `POST /api/metrics/run` (admin) → Node → `POST /train` FastAPI.

---

## Tests — Backend Analytics

Tests unitarios en `backend-analytics/tests/unit/`.

**Cómo parchear HuggingFace:**
```python
# CORRECTO — parchear donde se importa, no el paquete original
@patch("infrastructure.ml.transformer_pipeline.hf_pipeline")

# INCORRECTO — no funciona con _LazyModule de transformers
@patch("transformers.pipeline")
```

**Simular modelo no cargado:**
```python
model.is_loaded.return_value = False   # correcto
# model._pipeline = None              # incorrecto — el use case usa is_loaded()
```

---

## Roles y permisos (RBAC)

| Rol | Acceso |
|---|---|
| `student` | Ver establecimientos, crear/editar/eliminar propias reseñas |
| `manager` | Dashboard de métricas de su establecimiento, responder reseñas |
| `admin` | Todo lo anterior + gestión de usuarios y establecimientos, pipeline ML |

`userId` en reviews se fuerza desde el JWT, nunca del body de la request.

---

## Seguridad — reglas activas

- JWT sin fallback secret — usa `env.JWT_SECRET` obligatorio
- `UpdateProfileSchema` solo permite: name, avatarUrl, bio, universityId
- Rate limiting por `userId` del JWT: 10 reviews/hora, 20 uploads/hora
- Moderación de imágenes NSFW vía Sightengine antes de subir a Supabase
- FastAPI protegida con `X-API-Key` en `/predict` y `/train`
- CORS con orígenes explícitos (`CORS_ORIGINS` en prod)
- Swagger deshabilitado en producción
