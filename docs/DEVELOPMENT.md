# Development

## Prerequisites

- Use Node.js 22.12 or newer in the 22 line, or Node.js 24; the installed dependency tree requires a modern runtime. This cleanup was run with Node 24.15 and npm 11.15.
- Use npm from the repository root; the lockfile and workspaces own dependency resolution.
- PostgreSQL is required for real API data/persistence. Redis is optional and disabled in the example.
- A compatible catalogue-data service is required to populate module data. SMTP and OAuth providers are separate account-flow dependencies.

There is no checked-in Docker Compose or CI deployment pipeline. Commands below assume the services are provisioned separately.

## Setup

From the repository root, create local configuration files using PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

On a POSIX shell, use `cp` instead of `Copy-Item`. Never overwrite an existing local file without preserving its values. Configure the database, JWT secret, origins, frontend/backend URLs, and integrations before startup.

```sh
npm ci
npm run prisma:generate --workspace backend
```

The backend postinstall normally generates Prisma Client; explicitly rerun generation after schema changes or when lifecycle scripts were skipped. Keep database migration execution separate from installation. Read the database release-safety procedure in [Operations](OPERATIONS.md) before applying migrations.

For an already aligned development database, review pending migrations and then use the backend development migration command only against that disposable/authorized target:

```sh
npm run prisma:migrate:dev --workspace backend
```

`migrate dev` can request a database reset when history/schema drift exists. Do not accept a reset on valuable data. The cleanup's migration was tested on disposable PostgreSQL; it has not been applied to an existing user or production database.

## Frontend configuration

`frontend/.env.example` is the checked-in starting point. `frontend/src/shared/config/index.ts` fails on absent required public variables; numeric/boolean values are parsed there. Public values are included in browser bundles and must contain no secrets.

| Variable(s) | Meaning / example |
| --- | --- |
| `PORT` | Next.js listener, `3000` |
| `NEXT_PUBLIC_APP_HOST` | Example host metadata; current shared configuration uses the explicit app URL |
| `NEXT_PUBLIC_APP_URL` | Required browser base URL, `http://localhost:3000` |
| `BACKEND_API_URL` | Server rewrite target including `/api`, `http://localhost:3111/api` |
| `NEXT_PUBLIC_API_URL` | Browser API prefix, `/api` |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | Axios timeout, `30000` |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_TITLE`, `NEXT_PUBLIC_APP_TAGLINE`, `NEXT_PUBLIC_APP_DESCRIPTION` | Required branding strings |
| `NEXT_PUBLIC_DONATION_URL` | Required external donation link |
| `NEXT_PUBLIC_REPO_URL`, `NEXT_PUBLIC_REPO_ISSUES_URL` | Optional external repository links; blank disables |
| `NEXT_PUBLIC_FEATURE_GUEST_MODE`, `NEXT_PUBLIC_FEATURE_CSV` | Boolean configuration flags |
| `NEXT_PUBLIC_LIMIT_MAX_PLANNING_YEARS`, `NEXT_PUBLIC_LIMIT_MAX_MODULES_PER_SEM`, `NEXT_PUBLIC_LIMIT_MAX_SAVED_TIMETABLES` | Numeric planning configuration |

The example enables guest/CSV flags and uses limits 6/10/10. Config values alone do not prove every UI/server path enforces a limit. Changes to public variables or rewrite targets require rebuilding production assets.

## Backend configuration

`backend/src/config/env.ts` is the validation authority. Environment files are loaded from the backend directory, including environment-specific and local overlays. Use examples rather than real credentials in docs/tests.

| Group | Variables / behavior |
| --- | --- |
| Database | `DATABASE_URL`, or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` used to derive it |
| Application auth | `JWT_SECRET` (at least 32 characters), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| Server | `PORT`, `NODE_ENV`, `COMPRESSION_ENABLED`, `PUBLIC_API_HOST`; `PUBLIC_API_URL` is derived where possible |
| Origins/rate limits | `ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`, `RATE_LIMIT_AUTH_MAX` |
| OAuth, optional | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; corresponding `GITHUB_*` |
| Email, optional configuration | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Catalogue source, optional configuration | `EXTERNAL_API_URL`, `EXTERNAL_API_KEY`; required operationally for ingestion |
| Redis | `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_TLS`, `REDIS_KEY_PREFIX`; optional URL/user/password |
| Catalogue cache | `CACHE_DEFAULT_TTL_SECONDS` |
| Sync | `SYNC_CRON_SCHEDULE`, `SYNC_ENABLED`, `SYNC_ON_STARTUP` |
| Logging/docs | `LOG_LEVEL`, `SWAGGER_ENABLED`; optional `SWAGGER_SERVER_URLS`, `BUILD_ID` |

When an SMTP host is set, port/from must be supplied; SMTP user/password must be supplied together. The example OAuth/SMTP values are placeholders. Remove optional placeholder values or configure actual providers before trying account flows. A service may start without optional integrations while relevant workflows remain unavailable.

Redis parameter strings are still required by the schema even with `REDIS_ENABLED=false`; the example supplies them. For offline catalogue development, disable scheduled/startup sync and use a prepared local dataset. There is no bundled catalogue seed dataset.

## Run services

Use separate terminals at the repository root:

```sh
npm run dev:frontend
npm run dev:backend
```

`npm run dev` starts only the frontend. It does not orchestrate the backend/database. Open `http://localhost:3000`; API health is at `http://localhost:3111/api/health` with the example ports.

## Command reference

| Root command | What it runs |
| --- | --- |
| `npm run dev:frontend` | Next.js development server |
| `npm run dev:backend` | Express under tsx watch |
| `npm run build` | Next.js production build, then backend TypeScript build |
| `npm run type-check` | Frontend `tsc --noEmit`, then backend build |
| `npm run lint` | Frontend ESLint, then backend ESLint; second workspace runs only if first passes |
| `npm test` | Frontend Vitest run, then backend Vitest run |
| `npm run test:e2e` | Frontend Playwright suite with configured dev web server |
| `npm run db:migrate` | Backend development migration command |
| `npm run start` | Production frontend only |
| `npm run start:backend` | Compiled Express server |

Backend-only commands include `prisma:generate`, `prisma:migrate` (deploy existing migrations), `prisma:migrate:dev`, `prisma:studio`, `jobs`, `test:watch`, and `format`. The backend `format` command rewrites source; use it only on intended scope.

## Validation workflow

1. Generate Prisma Client after schema changes.
2. Run targeted tests, then `npm test` for cross-layer changes.
3. Run `npm run type-check` and relevant lint checks.
4. Run `npm run build` for route/config/import changes.
5. Run `npm run test:e2e` for retained browser workflows.
6. Inspect diff, docs links, stale references, generated output, and scope.

Unit test setup loads checked-in example values and overrides test-only identity/database settings. It does not require a real `.env`, SMTP, OAuth, or live database. Prisma is mocked by backend test setup. Both test scripts terminate after one run; watch mode is explicit.

Install a Playwright browser if no compatible cached browser is available:

```sh
npx playwright install chromium
```

Playwright starts the frontend automatically. Supply frontend environment values from the example or a local test configuration. The suite uses API fixtures and does not validate a deployed backend or catalogue provider.

## CSV and local state

The roadmap exporter writes `Module Code`, `Title`, `Prerequisites`, `AU`, `Grade`, `Remarks`, `Year`, and `Semester`. Parsing and validation live in `frontend/src/features/course-planner/utils.ts`; retain that format when changing import/export. Estimates use entered grades/AU and are advisory.

Browser persistence belongs to the current browser/origin. Save or export valuable work before clearing site data or switching origins. Old account persistence is invalidated during the one-time version upgrade; the account is reloaded from application cookies/tokens. The roadmap storage upgrade immediately removes unsupported fields while preserving modules, metadata, and the saved-module snapshot.

## Troubleshooting

| Symptom | Inspect / recovery |
| --- | --- |
| Missing public configuration | Check every required frontend variable, including `NEXT_PUBLIC_APP_URL`; restart/rebuild after edits |
| API rewrite returns connection errors | Ensure backend is running and rewrite target includes `/api` and correct port |
| Prisma type errors after schema edit | Regenerate client; do not edit generated types |
| Database startup errors | Check connection configuration and provisioning; do not print secrets |
| Database missing tables/columns | Check migration status/schema alignment; client generation does not create tables |
| Empty catalogue | Confirm populated PostgreSQL, source configuration, ingestion logs, and semester filtering |
| Account verification/recovery fails | Check email transport; placeholders cannot deliver mail |
| OAuth unavailable/fails | Check provider config and exact backend/frontend callback URLs |
| Unexpected 401 on later routes | Inspect router ordering and auth middleware before assuming a public route |
| No generated combinations | Inspect candidate indexes and constraints; relax conflicting filters and retry |
| Preset loses modules while loading | Check current catalogue/semester index availability and preset loader's skip behavior |

Report an exact command/status and relevant redacted error, distinguishing local checks from upstream or production validation.
