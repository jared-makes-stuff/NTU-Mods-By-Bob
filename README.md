# NTU Mods

A modern, full-stack web application for NTU students to plan their course schedules, generate timetables, and manage their academic journey.

## Features

### Course Planning
- Browse and search 4000+ NTU modules
- Filter by school, AU credits, semester
- View prerequisites and module details
- Plan your multi-year course schedule
- Track total AU credits

### Timetable Generation
- Create custom timetables from course plans
- Automatic conflict detection
- Multiple timetable versions
- Visual weekly schedule view
- Export and share timetables

### Vacancy Alerts
- Get notified when module vacancies open
- Telegram integration for real-time alerts
- Track multiple modules simultaneously

### Module Information
- Comprehensive module search
- Detailed module information
- Prerequisite flow charts
- Module reviews and topics

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| **Backend** | Express.js 5, TypeScript, Node.js 20+ |
| **Database** | PostgreSQL 16 with Prisma ORM 5 |
| **Caching** | Redis (optional) |
| **Auth** | JWT (access + refresh tokens) |
| **Docs** | Swagger/OpenAPI 3.0 |

## Architecture

```
+--------------------------------------------------+
|                Frontend (Next.js)                |
|  - React 19 with App Router                      |
|  - TypeScript for type safety                    |
|  - shadcn/ui components                          |
|  - Zustand for state management                  |
+------------------------+-------------------------+
                         | REST API (Axios)
                         v
+------------------------+-------------------------+
|                Backend (Express.js)              |
|  - TypeScript + Node.js                          |
|  - JWT Authentication                            |
|  - Swagger/OpenAPI docs                          |
|  - Strategy pattern for data sync                |
+------------------------+-------------------------+
                         | Prisma ORM
                         v
+------------------------+-------------------------+
|              PostgreSQL Database                 |
|  - Users, Modules, Course Plans                  |
|  - Timetables, Indexes, Auth                     |
|  - JSONB for flexible data                       |
+--------------------------------------------------+
```

## Project Structure

```
ntu-mods/
├── backend/                 # Express.js API server
│   ├── src/                # Source code
│   ├── prisma/             # Database schema and migrations
│   ├── tests/              # API tests
│   └── README.md           # Backend documentation
│
├── frontend/               # Next.js application
│   ├── src/               # Source code
│   ├── e2e/               # End-to-end tests
│   └── README.md          # Frontend documentation
│
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ (20.x recommended)
- PostgreSQL 13+
- Redis (optional, for caching)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/ntu-mods.git
cd ntu-mods
npm install
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start server
npm run dev
```

Backend runs on: http://localhost:3000  
API Docs: http://localhost:3000/api-docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend runs on: http://localhost:3001

### 4. Access the Application

1. Open http://localhost:3001
2. Register a new account
3. Browse modules and create course plans
4. Generate timetables

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ntu_mods"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=NTU Mods
```

## Docker Setup (Optional)

For easy setup of PostgreSQL and Redis:

```bash
# PostgreSQL
docker run --name ntu-postgres \
  -e POSTGRES_USER=ntu \
  -e POSTGRES_PASSWORD=ntu \
  -e POSTGRES_DB=ntu_mods \
  -p 5432:5432 -d postgres:16

# Redis (optional)
docker run --name ntu-redis \
  -p 6379:6379 -d redis/redis-stack-server:latest
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

## API Documentation

Interactive API documentation is available at `/api-docs` when the backend server is running.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/modules` | List modules (paginated) |
| `GET /api/modules/:code` | Module details |
| `GET /api/modules/search` | Search modules |
| `GET /api/semesters` | Available semesters |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login user |
| `GET /api/timetables` | User timetables |
| `POST /api/timetable/generate` | Generate timetables |

## Feature Status

| Feature | Status |
|---------|--------|
| Authentication | Ready |
| Module Catalogue | Ready |
| Course Planning | Ready |
| Timetable Generation | Ready |
| Vacancy Alerts | Ready |
| Module Reviews | Ready |

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes with tests
4. Commit: `git commit -m 'feat: description'`
5. Push and open Pull Request

## License

MIT

---

For detailed documentation, see:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
