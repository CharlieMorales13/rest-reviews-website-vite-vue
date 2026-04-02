# Comprehensive API & Database Test Suite Plan

This plan addresses your request to build extensive, professional unit tests (and integration tests) covering the entirely of the backend API and database, placing them inside your `backend-node/src/tests/` directory as requested.

## User Review Required
> [!IMPORTANT]
> Se requiere confirmar la estrategia. Solicitas "pruebas unitarias" pero también "que prueben toda la base de datos". En Node, las pruebas **unitarias** se *burlan* (mock) de la base de datos para probar la lógica cruda, mientras que las pruebas de **integración** sí interactúan con la base de datos real (Prisma) para asegurar que los datos fluyan correctamente. 
> Esta propuesta construirá **ambas capas** para darte la máxima seguridad. ¿Estás de acuerdo con este enfoque híbrido?

## Proposed Changes

---

### Capa 1: Pruebas Unitarias de Casos de Uso (Business Logic)
This layer will test all DDD Use Cases in complete isolation using `vi.mock()` for repositories.

#### [NEW] `backend-node/src/tests/unit/use-cases/auth.test.ts`
- Tests for `LoginUseCase`, `RegisterUseCase`, `RefreshTokenUseCase`.
- Asserts token generation logic, password hashing verifications, active user checks.

#### [NEW] `backend-node/src/tests/unit/use-cases/establishments.test.ts`
- Tests for `CreateEstablishmentUseCase`, `UpdateEstablishmentUseCase`, `ListEstablishmentsUseCase`.

#### [NEW] `backend-node/src/tests/unit/use-cases/metrics.test.ts`
- Tests for `CalculateDailyMetricsUseCase` to ensure the mathematical formulas for the IGE index are strictly correct.

#### [NEW] `backend-node/src/tests/unit/use-cases/users.test.ts`
- Tests for User profile updates, RBAC protections, etc.

---

### Capa 2: Pruebas Unitarias de Controladores (HTTP Layer)
This layer will test all Controllers, mocking req/res objects and isolated from Use Cases.

#### [NEW] `backend-node/src/tests/unit/controllers/AuthController.test.ts`
- Verifies proper HTTP status codes (200, 201, 400, 401), DTO Zod validation intercept, and response payloads.

#### [NEW] `backend-node/src/tests/unit/controllers/EstablishmentController.test.ts`
#### [NEW] `backend-node/src/tests/unit/controllers/MetricsController.test.ts`
#### [NEW] `backend-node/src/tests/unit/controllers/UserController.test.ts`

---

### Capa 3: Pruebas de Integración (API & Base de Datos)
This layer satisfies your request to "test the whole database". We will extend the existing integration tests.

#### [MODIFY] `backend-node/tests/integration.test.ts`
- We will expand this existing file to execute real API requests against a local DB instance.
- **Added Scenarios**:
  - Full Authentication Flow (Register -> Login -> Fetch Profile).
  - Create Review Flow (simulated student creating a review).
  - Manager Reply Flow (simulating the endpoints created previously).
  - Metrics Generation verification on the DB.

## Open Questions
1. **Testing Database:** Las pruebas de integración reales crearán registros (Ej. Crear un Establishment) en tu base de datos actual definida en `.env`. ¿Es seguro hacer esto o preferirías que añada comandos de limpieza (`afterAll` truncates)?
2. **Library Preference:** Actualmente tu `integration.test.ts` usa llamadas asíncronas con `fetch`. ¿Deseas seguir con `fetch` nativo o prefieres que instale `supertest` que es la librería estándar de la industria para tests de APIs en Node?

## Verification Plan

### Automated Tests
- Command: `npx vitest run` targeting specifically `src/tests`.
- Command: `npx vitest run tests/integration.test.ts` para pruebas de extremo a extremo.

### Manual Verification
- Review the standard output of Vitest to confirm ~20-30 individual tests successfully pass.
