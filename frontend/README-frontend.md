# Anáhuac Eats — Frontend

SPA + PWA construida con **Vue 3**, **Vite** y **TypeScript**. Arquitectura Feature-Sliced Design (FSD). Instalable como app nativa en dispositivos móviles y de escritorio.

---

## Stack

| Tecnología | Uso |
|---|---|
| Vue 3 + Vite + TypeScript | Framework + bundler + tipado |
| Vue Router 4 | Enrutamiento SPA con guards por rol |
| Pinia | Gestión de estado global |
| Tailwind CSS | Estilos utilitarios |
<<<<<<< HEAD
| Axios | HTTP client |
| Chart.js + vue-chartjs | Gráficas de sentimiento y métricas |
=======
| vite-plugin-pwa | Service worker + Web App Manifest |
| Supabase JS | Realtime (notificaciones via postgres_changes) |
| qr-code-styling | Generación de QR codes estilizados |
| Vitest + Vue Test Utils | Tests unitarios |
>>>>>>> db1b361bf5318d689558f26c68c65f5e8b49a406

---

## Arquitectura — Feature-Sliced Design (FSD)

```
<<<<<<< HEAD
frontend/src/
├── app/          # Inicialización global (App.vue, router, estilos)
├── pages/        # Vistas completas (una por ruta)
├── widgets/      # Bloques UI autónomos (Pagination, KpiCard, SentimentChart)
├── features/     # Interacciones de usuario con valor de negocio
├── entities/     # Modelos de dominio + servicios API
│   ├── review/   # ReviewService, tipos
│   └── user/     # UserService, tipos, authStore
└── shared/
    ├── ui/       # ~18 componentes base (BaseButton, AppToast, Spinner...)
    └── lib/      # composables, utils (useToast, extractError...)
=======
src/
├── app/
│   ├── router/            # Rutas, guards de autenticación y roles
│   └── main.ts            # Entry point — inicializa auth antes del mount
├── entities/
│   ├── user/
│   │   ├── api/           # AuthService.ts
│   │   └── model/         # authStore.ts (Pinia)
│   ├── review/
│   │   ├── api/           # ReviewService.ts
│   │   └── model/         # types.ts
│   ├── establishment/
│   │   └── api/           # EstablishmentService.ts
│   └── notification/
│       ├── model/         # notificationStore.ts (Pinia + Supabase Realtime)
│       └── ui/            # NotificationBell.vue, NotificationPanel.vue
├── features/
│   ├── create-post/       # CreatePostModal.vue
│   └── review/            # EditReviewForm.vue
├── pages/
│   ├── login/             # LoginPage.vue
│   ├── register/          # RegisterPage.vue
│   ├── verify-email/      # VerifyEmailPage.vue (OTP 6 dígitos)
│   ├── forgot-password/   # ForgotPasswordPage.vue
│   ├── reset-password/    # ResetPasswordPage.vue
│   ├── dashboard/         # StudentDashboard, ManagerDashboard, AdminDashboard
│   ├── establishments/    # EstablishmentsPage, EstablishmentDetailsPage
│   ├── create-review/     # CreateReviewPage.vue
│   ├── profile/           # ProfilePage, EditProfileModal, MyReviewsPage, ChangePasswordModal
│   ├── manager-establishment/ # ManagerEstablishmentPage.vue
│   ├── manager-reviews/   # ManagerReviewsPage.vue
│   ├── admin/             # AdminDashboard, CreateUserModal, EditUserModal
│   └── qr-redirect/       # QrRedirectPage.vue
├── widgets/
│   ├── Layout/            # AppLayout.vue (navbar + footer + mobile drawer)
│   ├── sentiment-chart/   # SentimentChart.vue (Chart.js doughnut)
│   ├── kpi-card/          # KpiCard.vue
│   └── pagination/        # Pagination.vue
└── shared/
    ├── ui/                # BaseButton, BaseModal, StarRating, OtpInput, QrCodeCard,
    │                      # ReviewCard, ReviewLightbox, ImageLightbox, SkeletonCard,
    │                      # AppToast, Badge, Spinner, Tabs, TextInput, TextArea...
    ├── api/               # httpClient.ts (Axios + interceptors)
    └── lib/               # extractError.ts, constants.ts
>>>>>>> db1b361bf5318d689558f26c68c65f5e8b49a406
```

---

## Rutas (16 rutas)

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | LoginPage | guest |
| `/register` | RegisterPage | guest |
| `/verify-email` | VerifyEmailPage | guest |
| `/forgot-password` | ForgotPasswordPage | guest |
| `/reset-password` | ResetPasswordPage | guest |
| `/dashboard` | StudentDashboard | `student` |
| `/my-reviews` | MyReviewsPage | `student` |
| `/establishments` | EstablishmentsPage | autenticado |
| `/establishments/:slug` | EstablishmentDetailsPage | autenticado |
| `/create-review/:slug` | CreateReviewPage | `student` |
| `/profile` | ProfilePage | autenticado |
| `/manager` | ManagerDashboard | `manager` |
| `/manager/mi-establecimiento` | ManagerEstablishmentPage | `manager` |
| `/manager/resenas` | ManagerReviewsPage | `manager` |
| `/admin` | AdminDashboard | `admin` |
| `/r/:slug` | QrRedirectPage | público |

---

## Estado global (Pinia)

### `authStore`
Gestiona el ciclo de vida de autenticación completo:
- Login / logout / register
- Email verification (OTP 6 dígitos)
- Refresh de tokens (rotación automática via interceptor Axios)
- Forgot password / reset password
- Actualización de perfil
- Persistencia de sesión en localStorage (datos no sensibles)

### `notificationStore`
- Suscripción a `postgres_changes` via Supabase Realtime
- Conteo de no leídas en tiempo real
- Inicialización y cleanup por lifecycle del componente

---

## PWA

- **Service worker** generado por `vite-plugin-pwa` (Workbox, estrategia `generateSW`)
- **Web App Manifest** — nombre, íconos, `theme_color: #f97316`, `display: standalone`
- **Precaché:** 52 assets estáticos (~1.77 MB)
- **Estrategias de caché:**
  - Google Fonts → CacheFirst (1 año)
  - Imagen de fondo grande → CacheFirst (30 días)
  - Llamadas API → NetworkOnly (datos frescos siempre)
- **Íconos:** `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`

---

## UX Patterns

| Componente | Descripción |
|---|---|
| `AppToast` | Notificaciones toast (success/error/info, auto-dismiss) |
| `BaseModal` | Modal configurable (tamaño, tema, closable) con Teleport |
| `SkeletonCard` | Placeholder animado (animate-pulse) durante carga |
| `Pagination` | Variante simple y numérica, estado disabled y loading |
| `ReviewLightbox` | Carrusel de imágenes con navegación por teclado (Esc, flechas) |
| `OtpInput` | Input de 6 dígitos para verificación de email |
| `QrCodeCard` | QR estilizado con isotipo en el centro, descargable en PNG |
| `StarRating` | Visualización de calificación con estrellas (`role="img"`, aria-label para lectores de pantalla) |
| `StarRatingInput` | Input interactivo de estrellas para formularios (`aria-pressed`, `role="group"`) |

---

## Accesibilidad (WCAG 2.1 AA)

| Componente | Implementación |
|---|---|
| `BaseModal` | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus trap con Tab/Shift+Tab; restaura foco al cerrar; Escape cierra el modal |
| `StarRating` | `role="img"` + `aria-label` descriptivo; estrellas con `aria-hidden` |
| `StarRatingInput` | `role="group"` + `aria-pressed` en cada estrella |
| Botones ojo (contraseña) | `aria-label` dinámico "Mostrar/Ocultar contraseña" |
| `NotificationBell` | `aria-label="Notificaciones"` |
| Botón cerrar modal | `aria-label="Cerrar"` |

---

## Variables de entorno

Crea `frontend/.env` desde `frontend/.env.example`. Para desarrollo local, crea también `frontend/.env.local`:

| Variable | Descripción | Local |
|---|---|---|
| `VITE_API_URL` | URL base del backend Node | `http://localhost:3000` |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | igual |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | igual |

---

## Desarrollo local

```bash
npm install
npm run dev        # servidor en http://localhost:5173
npm run build      # build de producción (incluye service worker)
npm run preview    # preview del build
npm run lint       # eslint
npm test           # vitest
npm run test:coverage
```

---

## Tests

<<<<<<< HEAD
El frontend se despliega automáticamente en cada push a `master`.
=======
```bash
npm test
npm run test:coverage
```

**113 tests** en 13 archivos (Vitest + Vue Test Utils + jsdom). Áreas cubiertas: `authStore` (flujo completo auth/register/verify/refresh/forgot-password), `httpClient` (interceptors, error handling), `extractError` (utilidades), componentes UI (ReviewCard, NotificationPanel, EstablishmentsPage, LoginPage, VerifyEmailPage, QrRedirectPage, QrCodeCard).
>>>>>>> db1b361bf5318d689558f26c68c65f5e8b49a406

---

<<<<<<< HEAD
El archivo `vercel.json` configura el rewrite necesario para Vue Router en producción:
=======
## Assets / Brand
>>>>>>> db1b361bf5318d689558f26c68c65f5e8b49a406

```
public/
├── assets/images/
│   ├── imagotipo.png    # Icono + texto — auth pages, emails
│   ├── isotipo.png      # Solo icono circular — navbar móvil, QR, favicon
│   ├── logotipo.png     # Solo texto — navbar desktop, footer
│   └── university-bg.png
├── pwa-192x192.png      # Ícono PWA
├── pwa-512x512.png      # Ícono PWA (maskable)
└── apple-touch-icon.png # iOS home screen
```

---

## Git workflow

<<<<<<< HEAD
| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Home / Login | Público |
| `/establishments` | Lista de establecimientos | Autenticado |
| `/establishments/:slug` | Detalle + reseñas | Autenticado |
| `/create-review/:slug` | Crear reseña | `student` |
| `/dashboard` | Dashboard según rol | Autenticado |
| `/manager/mi-establecimiento` | Dashboard gerente | `manager` |
| `/admin` | Panel administrador | `admin` |
| `/profile` | Perfil de usuario | Autenticado |
| `/profile/my-reviews` | Historial de reseñas propias | Autenticado |

---

## Navegación por slug

Todos los `router.push` a establecimientos usan `est.slug`, no `est.id`. `CreateReviewPage` resuelve el slug al UUID real antes de llamar a `ReviewService.create`.

---

## Tests

```bash
cd frontend && npm test
```

~45 tests unitarios (vitest). Cobertura principal: `authStore`, `extractError`, composables de shared.

---

## Git workflow

Ver [flujo completo en el README raíz](../README.md#git-workflow). Resumen para este servicio:

```bash
git checkout -b feat/frontend-mi-feature
# desarrollar + tests
git commit -m "feat(profile): agregar edición de carrera"
git push origin feat/frontend-mi-feature
```

Scopes frecuentes en frontend: `profile`, `dashboard`, `reviews`, `establishments`, `auth`, `admin`.

---

## Seguridad frontend

- JWT almacenado en memoria (no localStorage)
- Guards de navegación por rol en Vue Router
- Sin SSR — SPA pura para evitar indexación (ecosistema cerrado universitario)
=======
Ver [flujo completo en el README raíz](../README.md#git-workflow). Scopes frecuentes: `auth`, `dashboard`, `establishments`, `reviews`, `profile`, `admin`, `frontend`, `brand`.
>>>>>>> db1b361bf5318d689558f26c68c65f5e8b49a406
