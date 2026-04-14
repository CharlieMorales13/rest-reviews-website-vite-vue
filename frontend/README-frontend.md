# Restaurant Analytics - Frontend UI

State-of-the-art dashboard built with **Vue 3**, **Vite**, and based on the **Feature-Sliced Design (FSD)** architectural methodology.

---

## 🏗️ Architecture: Feature-Sliced Design (FSD)

FSD is a modern architectural pattern for frontends that ensures scalability and clean dependency management. The project is organized into strictly defined layers:

### Layers Hierarchy
1.  **App**: Global setup, providers, and global styles.
2.  **Pages**: Full-screen views composed of widgets and features.
3.  **Widgets**: Autonomous UI blocks (e.g., Sidebar, Analytics Charts).
4.  **Features**: User interactions that bring business value (e.g., Filter Establishments).
5.  **Entities**: Domain models and their specific logic (e.g., Establishment, Review).
6.  **Shared**: Generic, reusable assets and UI components.

> 🛡️ **Rule of Dependencies**: A layer can only import from lower layers. Imports towards higher layers are strictly forbidden.

---

## 🚀 Technical Stack

-   **Framework**: Vue 3 (Composition API)
-   **Build Tool**: Vite (Lightning fast HMR via strict workspace isolation)
-   **Styling**: Tailwind CSS (Fully configured within `/frontend`)
-   **State Management**: Pinia (Reactive Store)
-   **Routing**: Vue Router
-   **Typing**: Strict TypeScript (`noUncheckedSideEffectImports`, `strict: true`)

---

## 📁 Folder Structure

```text
frontend/src/
├── app/              # Global initialization (App.vue, router)
├── pages/            # View components (Home, Dashboard)
├── widgets/          # Complex, self-contained blocks
├── features/         # User interaction logic
├── entities/         # Business data models
└── shared/           # Base UI, utils, constants
```

---

## 🛠️ Development

### Setup
```bash
npm install
```

### Environment Variables
Create a `.env` file from `.env.example`:
-   `VITE_API_URL`: Base URL of the backend API (default: `http://localhost:3000`).

### Run
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 📊 Visual Features
-   **Interactive Charts**: Visualization of sentiment trends and IGE scores.
-   **Responsive Design**: Optimized for desktops and mobile devices using modern CSS layouts.
-   **Real-time Metrics**: Dynamic data fetching from the Node.js backend.
