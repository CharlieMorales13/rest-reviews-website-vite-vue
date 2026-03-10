# Frontend - Feature-Sliced Design (FSD)

Este proyecto utiliza **Feature-Sliced Design (FSD)**, una arquitectura moderna para aplicaciones frontend que escala de manera profesional y evita el acoplamiento técnico.

## ¿Qué es FSD?

FSD organiza el código por **Layers** (Capas) y **Slices** (Rebanadas), priorizando el valor de negocio sobre la distribución técnica.

### Capas del Proyecto (De arriba hacia abajo)

1.  **`app/`**: Configuración global de la aplicación (entry point, App.vue, estilos globales).
2.  **`pages/`**: Vistas de pantalla completa. Se componen uniendo varios *widgets*.
3.  **`widgets/`**: Bloques autónomos de la interfaz (ej: Barra lateral de navegación, Dashboard principal).
4.  **`features/`**: Interacciones del usuario que aportan valor (ej: "Enviar Reseña", "Filtrar Establecimientos").
5.  **`entities/`**: Lógica de los objetos de negocio (ej: Usuario, Establecimiento).
6.  **`shared/`**: Código reutilizable sin lógica de negocio (Botones genéricos, Assets, Utilidades, Temas CSS).

## Regla de Oro (Dependencias)

Una capa **solo puede importar de capas inferiores**. Por ejemplo:
- Una `Page` puede importar un `Widget` o una `Feature`.
- Un `Widget` **NUNCA** puede importar algo de una `Page`.
- Esto garantiza que no existan dependencias circulares y que el código sea extremadamente fácil de testear y mover.

## Cómo agregar código nuevo

Para el colega que se integra:
- Si vas a crear un componente genérico (un botón naranja), colócalo en `shared`.
- Si vas a crear la lógica de cómo se edita un perfil, colócalo en `features`.
- Si vas a crear los modelos de datos de Prisma en el front, colócalos en `entities`.
