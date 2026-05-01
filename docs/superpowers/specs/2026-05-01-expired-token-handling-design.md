# Diseño: Manejo profesional de token JWT expirado

**Fecha:** 2026-05-01  
**Scope:** `frontend/`  
**UX objetivo:** Redirect silencioso a `/login` cuando el token de autorización expira (sin toast ni mensaje).

---

## Problema

El token de acceso JWT dura 24 horas. No hay refresh token. Cuando un usuario vuelve al sitio después de ese período, la app presenta tres bugs:

1. **`initAuth()` corre tarde.** Se llama en `onMounted` de `App.vue`, *después* de que el navigation guard ya evaluó la ruta. El guard ve el token en memoria (`isAuthenticated = true`) y deja pasar al usuario antes de que nadie verifique si está vencido.

2. **El interceptor 401 es sucio.** Usa `window.location.href = '/login'` en vez del router de Vue, y nunca llama a `authStore.logout()`. El store Pinia queda con `user` y `token` stale.

3. **`fetchProfile()` silencia errores de expiración.** El catch swallow un comentario explícito ("no interrumpir la sesión"), en vez de cerrar la sesión correctamente.

---

## Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Método de detección | Decode local del JWT (campo `exp`) | Sin llamada de red extra; el token dura 24h fijas (el drift de reloj es irrelevante) |
| UX al expirar | Redirect silencioso a `/login` | Requerimiento explícito del usuario |
| Punto de chequeo inicial | `main.ts` (antes de `app.mount()`) | Garantiza que `initAuth()` corre antes del primer `beforeEach` del router |
| Redirect en el interceptor | `router.push('/login')` | Usa el router de Vue; evita recargar la página completa |
| Token malformado | Tratado como expirado | Falla segura |

---

## Archivos afectados

### 1. `frontend/src/shared/lib/jwt.ts` — nuevo

Helper puro que decodifica el payload del JWT y verifica el campo `exp`.

```ts
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // malformado = tratado como expirado
  }
}
```

No depende de ningún módulo del proyecto. Testeable de forma aislada.

---

### 2. `frontend/src/app/main.ts` — modificado

Mover `initAuth()` aquí, de forma síncrona, antes de `app.mount()`. Esto asegura que cuando el router ejecute el primer `beforeEach`, el store ya evaluó la validez del token.

```ts
const pinia = createPinia();
app.use(pinia);
app.use(router);

const authStore = useAuthStore();
authStore.initAuth(); // síncrono, antes de mount

app.mount('#app');
```

---

### 3. `frontend/src/app/App.vue` — modificado

Eliminar `initAuth()` de `onMounted` (ya no es necesario). Si `fetchProfile()` se sigue llamando aquí en el futuro, es solo para refrescar datos del usuario — no para autenticar.

---

### 4. `frontend/src/entities/user/model/authStore.ts` — modificado

**`initAuth()`:** Después de cargar el token de localStorage, verificar expiración. Si expirado → `logout()` inmediato.

```ts
const initAuth = () => {
  try {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
      if (isTokenExpired(storedToken)) {
        logout();
        return;
      }
      token.value = storedToken;
    } else {
      token.value = null;
    }
    // cargar user...
  } catch {
    logout();
  }
};
```

**`fetchProfile()`:** El catch ya no silencia errores — llama a `logout()`. El interceptor se encarga del redirect.

```ts
const fetchProfile = async () => {
  if (!token.value) return;
  try {
    const freshUser = await AuthService.getMe();
    user.value = freshUser;
    localStorage.setItem('user', JSON.stringify(freshUser));
  } catch {
    logout();
  }
};
```

---

### 5. `frontend/src/shared/api/httpClient.ts` — modificado

Reemplazar `window.location.href` con `router.push('/login')` y añadir `authStore.logout()`. Ambas importaciones se usan únicamente dentro del callback del interceptor (no en nivel de módulo), lo que evita problemas de inicialización circular.

```ts
import { router } from '@/app/router';
import { useAuthStore } from '@/entities/user/model/authStore';

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }
    return Promise.reject(error);
  },
);
```

---

## Flujos resultantes

### Scenario 1: Usuario abre el sitio después de 24h

```
main.ts
  → authStore.initAuth()
  → isTokenExpired(token) = true
  → logout() → token = null, localStorage limpio
  → app.mount()
  → router.beforeEach
  → isAuthenticated = false
  → redirect /login  ✓
```

### Scenario 2: Token expira mientras el usuario está activo

```
Cualquier llamada API
  → 401 response
  → interceptor
  → authStore.logout()
  → router.push('/login')  ✓
```

### Scenario 3: Token malformado en localStorage

```
initAuth()
  → isTokenExpired(token) → catch → return true
  → logout()  ✓
```

---

## Lo que NO cambia

- El navigation guard (`requiresAuth`, roles) permanece intacto — sigue siendo la segunda línea de defensa.
- No se agrega ninguna llamada de red extra en el inicio.
- No hay toast ni modal — redirect silencioso en todos los casos.
- No hay refresh token — es trabajo futuro (ya en el backlog).

---

## Tests requeridos

- `jwt.ts`: token válido → `false`; token expirado → `true`; token malformado → `true`
- `authStore`: `initAuth()` con token expirado → estado limpio (token = null, user = null)
- `authStore`: `fetchProfile()` lanza error → `logout()` llamado
