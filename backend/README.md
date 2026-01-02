# NTU Mods Backend

REST API built with Express.js, TypeScript, and PostgreSQL for university module planning, timetable generation, and vacancy alerts.

## Quick Start

### Prerequisites
- Node.js 18+ (20.x recommended)
- PostgreSQL 15+

### Installation

```bash
cd backend
npm install
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env

npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Server starts at http://localhost:3000  
API docs at http://localhost:3000/api-docs

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript
- **Framework:** Express.js 5
- **Database:** PostgreSQL 16, Prisma ORM 5
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Validation:** Zod
- **Documentation:** Swagger/OpenAPI 3.0
- **Testing:** Vitest

## Features

- JWT authentication with role-based access control
- Module catalogue with search and filtering
- Timetable creation and management
- Course planning across multiple semesters
- Vacancy alerts via Telegram integration
- Module reviews and topics
- Rate limiting and security headers
- Comprehensive API documentation

## Project Structure

```
src/
├── api/                 # HTTP layer
│   ├── routes/         # Route definitions
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation, errors
│   └── validators/     # Zod schemas
├── business/           # Domain services
│   └── services/       # Business logic
├── config/             # Configuration
│   ├── env.ts         # Environment variables
│   ├── database.ts    # Prisma client
│   └── redis.ts       # Redis client
├── data/               # Data synchronization
│   ├── factories/     # Strategy factory
│   └── strategy/      # Data source strategies
├── jobs/               # Scheduled jobs
├── telegrambot/        # Telegram bot for alerts
└── types/              # TypeScript types
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/ntu_mods?schema=public"

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET="your-secret-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Server
PORT=3000
NODE_ENV="development"

# CORS
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"

# Telegram Bot (optional)
TELEGRAM_BOT_ENABLED="false"
TELEGRAM_BOT_TOKEN="your-bot-token"

# Data Sync
SYNC_ENABLED="true"
SYNC_CRON_SCHEDULE="*/30 * * * *"
```

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get profile |
| PUT | `/api/auth/me` | Update profile |
| DELETE | `/api/auth/account` | Delete account |

### Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules` | List modules |
| GET | `/api/modules/search` | Search modules |
| GET | `/api/modules/:code` | Module details |
| GET | `/api/modules/:code/indexes` | Module indexes |
| GET | `/api/semesters` | Available semesters |

### Timetables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timetables` | List user timetables |
| POST | `/api/timetables` | Create timetable |
| GET | `/api/timetables/:id` | Get timetable |
| PUT | `/api/timetables/:id` | Update timetable |
| DELETE | `/api/timetables/:id` | Delete timetable |
| POST | `/api/timetable/generate` | Generate timetables |

### Vacancy Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vacancy-alerts/tasks` | List alerts |
| POST | `/api/vacancy-alerts/tasks` | Create alert |
| DELETE | `/api/vacancy-alerts/tasks/:id` | Delete alert |

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
npm test                    # Run all tests
npm test -- --coverage     # With coverage
npm test -- --watch        # Watch mode
```

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## License

MIT
