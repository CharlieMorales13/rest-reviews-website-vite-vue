# Restaurant Analytics - Node.js Backend

Professional Node.js backend implemented using **Clean Architecture** and **SOLID** principles.

## 🏗️ Architecture Layers

- **Domain**: Pure business rules and entities. No dependencies on frameworks or ORMs.
- **Application**: Atomic "Use Cases" for orchestration. Input validation via **Zod**.
- **Infrastructure**: Technical implementations (Prisma, Express, JWT, Error Handling).

## 🚀 Key Features

- **Prisma v7**: Native connection to Supabase via `@prisma/adapter-pg`.
- **Express 5**: Native async error handling (no more `try-catch` boilerplate in controllers).
- **Security**: Argon2 password hashing and JWT-based Auth with RBAC (Role-Based Access Control).
- **Standardized Errors**: Custom `AppError` and centralized global error middleware.

## 🛠️ Getting Started

1. `npm install`
2. Configure `.env` (Use `.env.example` as reference).
3. `npm run dev` (Development)
4. `npm run build` (Production compilation)

## 📜 Scripts

- `dev`: Start development server with `ts-node-dev`.
- `build`: Compile TypeScript to JavaScript.
- `prisma:generate`: Update Prisma Client.
- `prisma:push`: Sync schema with database.
