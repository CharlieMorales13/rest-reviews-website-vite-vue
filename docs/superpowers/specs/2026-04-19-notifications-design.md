# Diseño: Sistema de Notificaciones — Respuesta de Gerente

**Fecha:** 2026-04-19  
**Alcance:** Notificar a un estudiante en tiempo real cuando el gerente de un establecimiento responde su reseña.

---

## Resumen

Cuando un manager responde una reseña, el estudiante autor recibe una notificación en tiempo real a través de Supabase Realtime. La notificación es visible mediante un icono de campana en el navbar. Al hacer click en una notificación individual, se marca como leída y navega a `/my-reviews`.

---

## Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Transporte real-time | Supabase Realtime | Ya integrado en el proyecto, cero infraestructura extra en backend |
| Persistencia | Tabla `notifications` en Supabase | Sobrevive a cierres de sesión |
| Destino al hacer click | `/my-reviews` | Página existente que ya muestra la respuesta del gerente |
| Marcar como leído | Click individual en cada notificación | UX más granular |
| Visibilidad | Solo rol `student` | Los managers no reciben este tipo de notificación |

---

## Sección 1 — Base de datos

### DDL

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### Prisma model

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  reviewId  String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

---

## Sección 2 — Backend (backend-node)

### Estructura de archivos nuevos

```
domain/
  entities/Notification.ts
  repositories/INotificationRepository.ts

application/
  use-cases/notifications/
    CreateNotificationUseCase.ts
    GetNotificationsUseCase.ts
    MarkNotificationReadUseCase.ts
  dtos/NotificationDTO.ts

infrastructure/
  database/PrismaNotificationRepository.ts
  http/
    controllers/NotificationController.ts
    routes/notification.routes.ts
```

### Endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | Lista notificaciones del usuario autenticado (máx 20, orden DESC) | JWT |
| `PATCH` | `/api/notifications/:id/read` | Marca una notificación como leída | JWT (solo dueño) |

### Integración con ReplyToReviewUseCase

`ReplyToReviewUseCase` llama a `CreateNotificationUseCase` tras guardar la respuesta. Si falla la creación de la notificación, **no interrumpe el flujo** — la reply se persiste igual y el error se loguea.

```typescript
// Al final de ReplyToReviewUseCase.execute()
try {
  await this.createNotificationUseCase.execute({
    userId: review.userId,   // autor de la reseña
    reviewId: review.id,
    message: `El gerente de ${establishment.name} respondió tu reseña`,
  });
} catch (err) {
  logger.error('CreateNotification failed (non-critical):', err);
}
```

### Seguridad

- `GetNotificationsUseCase` filtra por `userId` del JWT — nunca expone notificaciones de otros usuarios.
- `MarkNotificationReadUseCase` verifica que la notificación pertenece al usuario antes de actualizar.

---

## Sección 3 — Frontend (frontend)

### Store: `useNotificationStore.ts`

```
state:
  notifications: Notification[]
  
getters:
  unreadCount: number  (computed)

actions:
  fetchNotifications()          → GET /api/notifications
  markAsRead(id: string)        → PATCH /api/notifications/:id/read (optimistic update)
  addNotification(n)            → push al array (llamado por Supabase Realtime)
  subscribeRealtime(userId)     → abre canal Supabase
  unsubscribeRealtime()         → cierra canal (en logout)
```

### Supabase Realtime

```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    store.addNotification(payload.new);
  })
  .subscribe();
```

### Componentes nuevos

**`NotificationBell.vue`** — insertado en `AppLayout.vue` a la izquierda del avatar, solo visible si `role === 'student'`:
- Icono `notifications` (Material Symbols)
- Badge naranja con `unreadCount` (oculto si es 0)
- Toggle del panel al hacer click

**`NotificationPanel.vue`** — dropdown bajo la campana:
- Lista de hasta 20 notificaciones
- No leídas: fondo `white/5` con punto naranja
- Leídas: texto atenuado
- Cada item: mensaje + timestamp relativo + botón de click
- Click en item: `markAsRead(id)` + `router.push('/my-reviews')`
- Estado vacío: "Sin notificaciones nuevas"

### Inicialización en AppLayout.vue

```typescript
onMounted(async () => {
  if (authStore.user?.role === 'student') {
    await notificationStore.fetchNotifications();
    notificationStore.subscribeRealtime(authStore.user.id);
  }
});

onUnmounted(() => {
  notificationStore.unsubscribeRealtime();
});
```

---

## Sección 4 — Flujo completo

```
Manager → PATCH /establishments/:slug/reviews/:id/reply
         ↓
  ReplyToReviewUseCase (guarda reply)
         ↓
  CreateNotificationUseCase (inserta en notifications)
         ↓
  Supabase detecta INSERT → emite evento al canal del estudiante
         ↓
  Frontend: store.addNotification() → badge +1
         ↓
  Estudiante abre panel → ve notificación destacada
         ↓
  Click en notificación → PATCH /notifications/:id/read + router.push('/my-reviews')
         ↓
  Badge -1, notificación pierde destacado
```

---

## Sección 5 — Testing

| Test | Tipo | Qué verifica |
|---|---|---|
| `CreateNotificationUseCase` | Unit | Crea notificación con `userId` del autor de la reseña |
| `ReplyToReviewUseCase` | Unit | Llama a `CreateNotificationUseCase` al responder; no lanza si falla |
| `GetNotificationsUseCase` | Unit | Solo devuelve notificaciones del `userId` del JWT |
| `MarkNotificationReadUseCase` | Unit | Solo el dueño puede marcarla como leída; 403 si es de otro usuario |

---

## Manejo de errores

| Escenario | Comportamiento |
|---|---|
| `CreateNotification` falla | Reply se guarda, notificación no llega, error logueado |
| Supabase Realtime se desconecta | Badge puede desactualizarse; `fetchNotifications()` lo corrige al reabrir app |
| `markAsRead` falla en red | Optimistic update en store igual — UX no se bloquea |
| Usuario no es `student` | Campana no se renderiza, suscripción nunca se abre |
