# Anáhuac Eats

Plataforma de reseñas de restaurantes universitarios para el campus Anáhuac Oaxaca. Ecosistema cerrado exclusivo para la comunidad — sin indexación pública.

[![CI](https://github.com/CharlieMorales13/rest-reviews-website-vite-vue/actions/workflows/ci.yml/badge.svg)](https://github.com/CharlieMorales13/rest-reviews-website-vite-vue/actions/workflows/ci.yml)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](https://anahuac-eats.com)
[![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-blue)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

**Live → [anahuac-eats.com](https://anahuac-eats.com)**

---

## Features

- **Reseñas con sentimiento automático** — Cada reseña es analizada por un modelo RoBERTa en español (`robertuito`) al momento de crearse.
- **IGE (Índice de Experiencia Gastronómica)** — Score 0–100 ponderado: comida 50%, servicio 30%, precio 20%.
- **Dashboard por rol** — Vistas diferenciadas para estudiante, gerente y administrador.
- **Respuestas de gerente** — El manager puede responder reseñas; el estudiante recibe notificación.
- **Likes en reseñas** — Persistentes, con conteo en tiempo real.
- **Subida de imágenes con moderación NSFW** — Sightengine filtra contenido antes de subir a Supabase Storage.
- **Panel de administración** — Gestión de usuarios, establecimientos y pipeline ML completo.
- **Perfil de usuario** — Avatar, bio, carrera, historial de reseñas propias.

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              anahuac-eats.com               │
│           Frontend SPA (Vercel CDN)         │
└─────────────────────┬───────────────────────┘
                      │ HTTPS
          ┌───────────▼───────────┐
          │   api.anahuac-eats.com │
          │  nginx + Let's Encrypt │
          └───────────┬───────────┘
                      │ HTTP (interna)
          ┌───────────▼───────────┐     ┌──────────────────────┐
          │   Backend Node        │────▶│  Backend Analytics   │
          │  Express + TypeScript │ HTTP│  FastAPI + Python    │
          │   Clean Architecture  │     │  RoBERTa transformer │
          └───────────┬───────────┘     └──────────────────────┘
                      │
          ┌───────────▼───────────┐
          │    Supabase Cloud      │
          │  PostgreSQL + Storage  │
          └───────────────────────┘
```

| Servicio | Tecnología | Docs |
|---|---|---|
| Frontend | Vue 3 + Vite + TypeScript + Pinia | [README-frontend.md](frontend/README-frontend.md) |
| Backend Node | Express + TypeScript + Prisma + tsyringe | [README-node.md](backend-node/README-node.md) |
| Backend Analytics | FastAPI + Python + PyTorch + RoBERTa | [README-analytics.md](backend-analytics/README-analytics.md) |
| Base de datos | Supabase (PostgreSQL + Storage) | — |

---

## Roles y permisos (RBAC)

| Rol | Permisos |
|---|---|
| `student` | Ver establecimientos, crear/editar/eliminar propias reseñas, dar likes |
| `manager` | Dashboard de métricas de su establecimiento, responder reseñas |
| `admin` | Todo lo anterior + gestión de usuarios, establecimientos y pipeline ML |

---

## Requisitos

- Node.js 20+
- Python 3.10+
- Docker + Docker Compose v2
- Cuenta Supabase

---

## Variables de entorno

Cada servicio requiere su propio `.env`. Copia los ejemplos y completa los valores:

```bash
cp backend-node/.env.example      backend-node/.env
cp backend-analytics/.env.example backend-analytics/.env
cp frontend/.env.example          frontend/.env
```

**Nunca commitees archivos `.env`.**

---

## Desarrollo local

```bash
# Backend Node
cd backend-node && npm install && npm run dev

# Backend Analytics
cd backend-analytics
python -m venv venv
.\venv\Scripts\activate         # Windows
source venv/bin/activate        # Linux/Mac
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && npm install && npm run dev
```

Con Docker (todos los servicios):

```bash
docker compose up --build
```

---

## Git workflow

### Ramas

| Rama | Propósito |
|---|---|
| `master` | Producción — todo merge aquí dispara CI/CD automático |
| `feat/<scope>` | Nueva funcionalidad |
| `fix/<scope>` | Corrección de bug |
| `refactor/<scope>` | Refactoring sin cambio de comportamiento |

### Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/), una línea, sin body:

```
feat(reviews): agregar likes persistentes
fix(auth): guard undefined segment en isTokenExpired
refactor(analytics): extraer SentimentReconciler a capa de dominio
```

Scopes comunes: `auth`, `reviews`, `establishments`, `analytics`, `dashboard`, `profile`, `admin`.

### Flujo estándar

```bash
# 1. Crear rama desde master
git checkout master && git pull
git checkout -b feat/mi-feature

# 2. Desarrollar — tests incluidos en el mismo commit
git add <archivos>
git commit -m "feat(scope): descripción corta"

# 3. Push y merge a master
git push origin feat/mi-feature
# merge a master → CI corre → deploy automático
```

### Reglas

- Los tests van en el mismo commit que el código. No se entrega lógica de negocio sin tests.
- En bug fixes: primero el test que reproduce el bug (debe fallar), luego el fix.
- `prisma db push` está prohibido — ver sección Base de datos.

---

## Tests

```bash
# Backend Node
cd backend-node && npm test

# Backend Analytics
cd backend-analytics && source venv/bin/activate && pytest tests/ -v

# Frontend
cd frontend && npm test
```

~270 tests en total: **~135 analytics**, **~90 Node**, **~45 frontend**.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) en cada push a `master`:

| Job | Qué hace |
|---|---|
| `test-analytics` | ruff lint + pytest |
| `test-node` | eslint + vitest |
| `docker-build` | build con cache GHA |
| `deploy` | SSH → VM → `git pull` → `docker compose up -d --build` |

El frontend se despliega automáticamente en **Vercel** en cada push a `master`.

---

## Base de datos

Schema en `backend-node/prisma/schema.prisma`. Referencia SQL en `backend-node/database/sql/`.

> **Importante:** `prisma db push` se cuelga con el pooler de Supabase. Flujo correcto para cambios de schema:
> 1. Aplicar DDL en **Supabase Dashboard → SQL Editor**
> 2. Ejecutar `npx prisma generate` localmente

---

## Seguridad

- JWT con secret obligatorio (sin fallback)
- Argon2id para hashing de contraseñas
- Helmet + CORS con orígenes explícitos
- Rate limiting: 30 req/15 min por IP en login, 10 reseñas/hora y 20 uploads/hora por `userId`
- Moderación de imágenes NSFW (Sightengine) antes de subir a Supabase Storage
- `X-API-Key` protege los endpoints de analytics
- Swagger deshabilitado en producción

---

## IGE — Índice de Experiencia Gastronómica

Puntuación ponderada 0–100 calculada por el servicio de analytics:

| Dimensión | Peso |
|---|---|
| Calidad de comida | 50% |
| Calidad de servicio | 30% |
| Relación precio-valor | 20% |

El pipeline corre automáticamente cada noche a las 2:00 AM y puede ejecutarse manualmente desde el panel de admin.
