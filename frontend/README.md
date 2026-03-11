# Frontend - Feature-Sliced Design (FSD)

Este proyecto utiliza **Feature-Sliced Design (FSD)**, una arquitectura moderna para aplicaciones frontend que escala de manera profesional y evita el acoplamiento técnico.

---

## ¿Qué es FSD?

FSD organiza el código en **Capas (Layers)**, ordenadas de mayor a menor nivel de abstracción. La regla fundamental es: **una capa solo puede importar de capas inferiores**; nunca al revés.

---

## Estructura de Carpetas

```
frontend/src/
├── app/              ← Entrada global (App.vue, main.ts)
├── pages/            ← Vistas completas de pantalla
│   ├── home/
│   └── establishments/
├── widgets/          ← Bloques autónomos de UI
│   ├── app-sidebar/
│   ├── sentiment-chart/
│   └── establishments-table/
├── features/         ← Acciones del usuario con valor de negocio
│   └── filter-establishments/
├── entities/         ← Modelos del dominio
│   ├── establishment/
│   └── user/
└── shared/           ← Código genérico reutilizable (CSS, utils, UI base)
    └── assets/css/
```

---

## Reglas de Dependencia

| Capa | Puede importar de |
|------|-------------------|
| `app` | `pages`, `widgets`, `features`, `entities`, `shared` |
| `pages` | `widgets`, `features`, `entities`, `shared` |
| `widgets` | `features`, `entities`, `shared` |
| `features` | `entities`, `shared` |
| `entities` | `shared` |
| `shared` | — (nada) |

> ⚠️ **Nunca** importes hacia arriba (ej: un `widget` no puede importar de un `page`).

---

## ¿Dónde pongo mi código?

| Tipo de código | Carpeta |
|---|---|
| Componente reutilizable (botón, input) | `shared/ui/` |
| Modelo de dato de negocio (Establishment) | `entities/` |
| Lógica de usuario (filtrar, buscar) | `features/` |
| Bloque de UI grande y autónomo (sidebar) | `widgets/` |
| Vista completa de página | `pages/` |
| Setup global de la app | `app/` |
