# NTU Mods by Bob

NTU Mods by Bob is a student planning application for discovering NTU modules, organizing a multi-semester course roadmap, comparing timetable combinations, and sharing module reviews and topics. It uses a Next.js/React frontend, an Express/Prisma backend, PostgreSQL, and optional Redis catalogue caching.

## Repository Scope
- Frontend application: `frontend/`
- Backend API: `backend/`
- Project documentation: `docs/`

## Quick Start
```bash
npm ci
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Configure both environment files and PostgreSQL before starting. Account creation also needs a working email transport. See [Development](docs/DEVELOPMENT.md) for the complete setup and migration procedure.

Run services in separate terminals:
```bash
npm run dev:frontend
npm run dev:backend
```

Default URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3111`

## Documentation
- [Documentation Index](docs/README.md)
- [Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Project Context](docs/PROJECT_CONTEXT.md)
- [Development](docs/DEVELOPMENT.md)
- [Operations](docs/OPERATIONS.md)

All product and contributor documentation is consolidated under `docs/`. Runtime OpenAPI annotations remain alongside backend source.

## Product Areas

| Area | Route | Purpose |
| --- | --- | --- |
| Course roadmap | `/course-planner` | Plan modules across semesters, annotate grades/remarks, import/export CSV |
| Timetable planner | `/timetable-planner` | Choose indexes, compare combinations, add custom events, export an image |
| Module discovery | `/module-info` | Catalogue search, class information, prerequisite graphs, reviews, topics |
| Account | Header dialogs | Application login, profile, email/password, optional OAuth |
| Administration | `/admin/users` | Role-controlled user management |

Guest plans are stored in the browser. Account holders can save a course roadmap and timetable presets. Results depend on catalogue freshness and user-entered information; they are advisory planning aids.

## Project Structure
```text
.
|-- backend/
|-- docs/
|-- frontend/
|-- package.json
|-- package-lock.json
`-- tsconfig.json
```
