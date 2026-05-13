# Anáhuac Eats — Backend Node

API REST construida con **TypeScript**, **Express** y **Clean Architecture**. Orquesta autenticación, reseñas, establecimientos, almacenamiento, métricas y notificaciones.

---

## Stack

| Tecnología | Uso |
|---|---|
| Node.js 20+ / TypeScript | Runtime + tipado estricto |
| Express | Framework HTTP |
| Prisma 6+ | ORM type-safe → Supabase PostgreSQL |
| tsyringe | Inyección de dependencias (decorators) |
| Zod | Validación de esquemas en DTOs |
| JWT + Argon2id | Autenticación + hashing de contraseñas |
| Resend | Envío de emails transaccionales |
| Helmet + CORS | Seguridad HTTP |
| express-rate-limit | Rate limiting por IP y userId |
| Pino | Logging estructurado (JSON) |
| node-cron | Tareas programadas (pipeline 2 AM, cleanup 3 AM) |
| Swagger UI | Documentación (solo en desarrollo) |
| Vitest | Tests unitarios e integración |

---

## Arquitectura — Clean Architecture

```
src/
├── domain/
│   ├── entities/          # Establishment, Review, User, Notification, Post
│   └── repositories/      # Interfaces (IReviewRepository, IUserRepository, etc.)
├── application/
│   ├── use-cases/         # Un archivo por caso de uso (auth, reviews, metrics, etc.)
│   └── dtos/              # Zod schemas + tipos inferidos
└── infrastructure/
    ├── database/          # PrismaXxxRepository (implementaciones)
    ├── services/          # AnalyticsService, SupabaseStorageService, VisionModerationService
    ├── email/
    │   └── templates/     # verificationEmail.ts, passwordResetEmail.ts
    ├── config/            # env.config, container.ts (DI), logger, swagger
    └── http/
        ├── controllers/   # Un controller por entidad
        ├── routes/        # auth, review, establishment, user, metrics, upload, notification
        └── middlewares/   # AuthMiddleware, RateLimitMiddleware, ErrorMiddleware
```

**Inyección de dependencias:** `tsyringe` con tokens registrados en `infrastructure/config/container.ts`. Todas las capas dependen de interfaces del dominio, nunca de implementaciones concretas.

---

## Variables de entorno

Crea `backend-node/.env` desde `backend-node/.env.example`. Para desarrollo local, crea también `backend-node/.env.local` con los overrides:

| Variable | Descripción | Local |
|---|---|---|
| `DATABASE_URL` | Conexión Supabase (pooler) | igual |
| `JWT_SECRET` | Secret para firmar tokens JWT (mín. 32 chars) | igual |
| `JWT_EXPIRES_IN` | Duración del access token (ej. `24h`) | igual |
| `SUPABASE_URL` | URL del proyecto Supabase | igual |
| `SUPABASE_KEY` | Anon key de Supabase | igual |
| `ANALYTICS_URL` | URL del servicio analytics | `http://localhost:8001` |
| `ANALYTICS_API_KEY` | Clave para autenticar requests al analytics | igual |
| `RESEND_API_KEY` | API key de Resend para emails | igual |
| `EMAIL_FROM` | Remitente de emails | igual |
| `SIGHTENGINE_API_USER` | Moderación de imágenes NSFW | igual |
| `SIGHTENGINE_API_SECRET` | Moderación de imágenes NSFW | igual |
| `CORS_ORIGINS` | Orígenes permitidos en producción | no aplica en local |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` |
| `COOKIE_DOMAIN` | Dominio para cookies (`.anahuac-eats.com` en prod) | vacío |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |

**Nunca commitees `.env` ni `.env.local`.**

---

## Desarrollo local

```bash
npm install
npm run dev       # ts-node-dev con hot reload
npm run build     # compila a dist/
npm run lint      # eslint
npm test          # vitest
npm run test:coverage  # vitest con reporte de cobertura
```

---

## Base de datos

Schema en `prisma/schema.prisma`. Referencia SQL en `database/sql/`. Seed de datos en `database/seed-reviews.mjs`.

> **Importante:** `prisma db push` se cuelga con el pooler de Supabase. Flujo correcto:
> 1. Aplicar DDL en **Supabase Dashboard → SQL Editor**
> 2. Ejecutar `npx prisma generate` localmente

---

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/auth/register` | Público |
| `POST` | `/api/auth/login` | Público |
| `POST` | `/api/auth/refresh` | Público |
| `POST` | `/api/auth/logout` | Autenticado |
| `POST` | `/api/auth/verify-email` | Público |
| `POST` | `/api/auth/resend-verification` | Público |
| `POST` | `/api/auth/forgot-password` | Público |
| `POST` | `/api/auth/reset-password` | Público |
| `GET` | `/api/establishments` | Autenticado |
| `GET` | `/api/establishments/:slug` | Autenticado |
| `GET` | `/api/establishments/:slug/reviews` | Autenticado |
| `POST` | `/api/reviews` | `student` |
| `PUT` | `/api/reviews/:id` | `student` (propias) |
| `DELETE` | `/api/reviews/:id` | `student` (propias) |
| `POST` | `/api/reviews/:id/reply` | `manager` |
| `POST` | `/api/reviews/:id/like` | Autenticado |
| `DELETE` | `/api/reviews/:id/like` | Autenticado |
| `POST` | `/api/upload` | Autenticado |
| `GET` | `/api/metrics/summary` | `manager`, `admin` |
| `GET` | `/api/metrics/global` | `admin` |
| `POST` | `/api/metrics/run` | `admin` |
| `GET` | `/api/notifications` | Autenticado |
| `PATCH` | `/api/notifications/:id/read` | Autenticado |
| `GET` | `/api/users` | `admin` |
| `GET` | `/health` | Público |

Documentación interactiva en `/api/docs` (solo en desarrollo).

---

## Seguridad

- **JWT** sin fallback secret — `JWT_SECRET` obligatorio. Access token (24h) + refresh token persistido en `userSession` con cleanup automático.
- **Argon2id** para hashing de contraseñas (estándar de la industria 2024)
- **Email verification** — OTP de 6 dígitos (Resend) requerido antes del primer login
- **`userId` en reseñas** forzado desde el JWT, nunca del body
- **Rate limiting (11 limiters):** login 30/15min · register 10/hr · reviews 10/hr · likes 60/hr · uploads 20/hr · manager writes 20/hr · pipeline 5/hr · public reads 100/15min · authenticated reads 200/15min · verify email 5/15min · resend 3/hr
- **Moderación NSFW** (Sightengine) antes de subir imágenes a Supabase Storage
- **Helmet** con headers de seguridad estándar
- **CORS** con orígenes explícitos en producción; localhost permitido en desarrollo
- **Swagger** deshabilitado en producción

---

## Tareas programadas (node-cron)

| Hora | Tarea |
|---|---|
| 02:00 AM | Pipeline de analytics — clasifica reseñas y genera snapshots IGE |
| 03:00 AM | Limpieza de sesiones expiradas o revocadas |

También ejecutables manualmente: pipeline vía `POST /api/metrics/run` (admin).

---

## Tests

```bash
npm test                  # vitest
npm run test:coverage     # con reporte lcov
```

**~90 tests unitarios e integración** (vitest). Cobertura: domain entities, use cases, controllers, middlewares, DTOs.

```typescript
// Mockear env.config en tests de middleware para evitar process.exit(1)
vi.mock('@/infrastructure/config/env.config', () => ({
  env: { JWT_SECRET: 'test-secret-key-for-unit-tests' }
}));
```

---

## Git workflow

Ver [flujo completo en el README raíz](../README.md#git-workflow). Resumen para este servicio:

```bash
git checkout -b feat/node-mi-feature
# desarrollar + tests en el mismo commit
git commit -m "feat(reviews): agregar endpoint de likes"
git push origin feat/node-mi-feature
```

Scopes frecuentes en Node: `auth`, `reviews`, `establishments`, `metrics`, `notifications`, `admin`, `upload`.
