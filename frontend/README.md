# NTU Mods Frontend

Next.js application for NTU Mods - a complete academic planning platform for NTU students.

## Quick Start

### Prerequisites
- Node.js 18+ (20.x recommended)
- Backend API running (see `../backend/README.md`)

### Installation

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3001 in your browser.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS
- **Components:** shadcn/ui (Radix UI)
- **State:** Zustand, React Query
- **HTTP:** Axios
- **Testing:** Vitest, Playwright

## Features

- Module search and filtering
- Timetable generation with conflict detection
- Multi-year course planning
- Vacancy alert management
- Module reviews and topics
- User authentication
- Admin user management

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Public pages (login, about)
│   ├── (app)/              # Protected pages (planner, timetable)
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # App providers
├── features/
│   ├── auth/               # Authentication
│   ├── course-planner/     # Course planning
│   ├── module-info/        # Module search
│   ├── timetable-planner/  # Timetable generation
│   ├── vacancy-alerts/     # Vacancy alerts
│   └── admin/              # Admin panel
└── shared/
    ├── api/                # API clients
    ├── data/               # React Query hooks
    ├── hooks/              # Shared hooks
    ├── lib/                # Utilities
    └── ui/                 # UI components
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=NTU Mods
NEXT_PUBLIC_APP_DESCRIPTION=Academic Planning for NTU Students
```

## Key Features

### Timetable Planner
- Module search and index selection
- Automatic timetable generation with filters
- Conflict detection and resolution
- Save and load timetable presets

Entry point: `features/timetable-planner/ui/TimetablePlanner.tsx`

### Course Planner
- Multi-year academic planning
- AU credit tracking
- CSV import/export
- Placeholder modules (MPE/BDE/UE)

Entry point: `features/course-planner/ui/CoursePlanner.tsx`

### Module Info
- Module search by code/name
- Detailed module information
- Prerequisite flowchart
- Module reviews

Entry point: `features/module-info/ui/ModuleInfo.tsx`

### Vacancy Alerts
- Telegram account linking
- Module/index alert management
- Requires Plus role

Entry point: `features/vacancy-alerts/ui/VacancyAlerts.tsx`

## Architecture

```
App Routes --> Feature UI --> Feature Hooks --> Data Layer --> API
                   |
                   v
              Shared UI
```

### Data Layer
- React Query for server state
- Query hooks in `shared/data/queries/*`
- API clients in `shared/api/*`

### State Management
- React Query: Server state
- Zustand: Cross-feature UI state
- Local state: Ephemeral UI state

## Role Hierarchy

```
superadmin > admin > pro > plus > user
```

- `user` - Basic access
- `plus` - Vacancy alerts
- `pro` - Enhanced features
- `admin` - User management
- `superadmin` - Full access

## Testing

```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

## Conventions

- Keep UI components presentational
- Move logic into hooks
- Use `shared/data` for server state
- Keep shared UI in `shared/ui`
- Feature UI in `features/<name>/ui`

## License

MIT
