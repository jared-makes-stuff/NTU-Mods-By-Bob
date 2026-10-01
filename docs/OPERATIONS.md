# Operations

## Deployment model

Deploy the Next.js frontend and Express backend as separate processes, with PostgreSQL and optional Redis. This repo contains application build/start commands rather than provider-specific hosting manifests. A build is not evidence that a deployment or live migration succeeded.

Configure production secrets through the host's environment facilities. Public frontend configuration and the API rewrite target must be set before the frontend build. Serve both components over HTTPS and set allowed origins to the actual frontend origin. Avoid exposing database/Redis endpoints publicly.

## Build and start

```sh
npm ci
npm run prisma:generate --workspace backend
npm run build
```

Start services separately:

```sh
npm run start
npm run start:backend
```

The backend runs `dist/server.js`. Generated Prisma Client and runtime dependencies must be present in the deployed artifact. The frontend uses the standard Next.js production server; no standalone-output packaging is configured.

When Swagger is enabled, its runtime generator scans annotations under `backend/src` relative to the backend working directory. Include those source files in that deployment layout; a distribution containing only `dist` does not supply the route annotations.

## Database release safety

The complete migration chain was applied to isolated PostgreSQL 16. Prisma migrate diff reported no drift against the current schema, and a populated upgrade fixture preserved account, module roadmap, metadata, and supported preferences. This verifies local execution; it does not prove a production upgrade or backup restore succeeds.

The new migration `20261001000000_reduce_planning_scope` removes obsolete plan targets and seat-cache columns and keeps supported top-level UI preferences in existing profiles. It preserves module roadmaps, account identities, timetable presets, and community content. The application sanitizes profile reads/updates before the migration runs.

The migration drops columns and discards unsupported settings. A backup is necessary to recover discarded data. It was tested on disposable local databases and has not been run against an existing user or production database.

For an existing database whose history and current schema are aligned:

1. Take a restorable backup and record the current migration status.
2. Review the new SQL against the actual target schema and migration ledger.
3. Validate in an isolated copy, including preserved plan/account records.
4. With explicit authorization, deploy pending migrations:

   ```sh
   npm run prisma:migrate --workspace backend
   ```

5. Deploy regenerated application code and verify health and retained workflows.

Do not edit migrations that may already have been applied. Do not use `migrate dev`, `db push`, a reset, or automatic checksum resolution as a substitute for a reviewed production upgrade. A rollback to older code after dropping columns may require restoring the compatible backup/schema.

## Configuration checklist

- `NODE_ENV=production`, suitable ports, compression policy, public API host, and actual frontend origin.
- Strong `JWT_SECRET` and deliberate token lifetimes; do not reuse examples.
- Valid database connection and aligned schema/client.
- Required frontend branding/URL/timeouts/flags/limits set at build time.
- OAuth credentials/callbacks only for providers intentionally enabled.
- Working SMTP settings for verification/recovery workflows.
- Catalogue source URL/key and explicit synchronization schedule/startup behavior.
- Complete Redis parameters if using cache; schema-required example parameters even when disabled.
- Appropriate logging and deliberate Swagger exposure. `SWAGGER_SERVER_URLS` can specify public server URLs.

See [Development](DEVELOPMENT.md) for the complete variable groups and typed configuration sources.

## Catalogue ingestion and caching

The server schedules ingestion when `SYNC_ENABLED=true`. `SYNC_ON_STARTUP=true` initiates background ingestion rather than blocking HTTP startup. The schedule uses node-cron's runtime timezone unless the implementation is changed to specify one; do not assume Singapore time from a deployment location or docs date.

The job fetches configured catalogue data, normalizes metadata/sessions/exams, persists records, and invalidates supported catalogue cache entries after successful sync. Missing optional exam data can be tolerated, while source failures are logged. Check source compatibility and timestamps/data before declaring catalogue freshness.

Avoid running both the server's sync scheduler and a separate jobs process unintentionally; duplicate scheduling can repeat ingestion. If multiple backend replicas are used, review scheduling ownership because distributed job locking is not established here.

Redis supplements PostgreSQL. With Redis disabled, database reads remain the source of catalogue data. Cache TTL is configuration; it is not a real-time data guarantee. Follow `backend/src/config/redis.ts` and `cache.ts` for connection/fallback behavior.

## Health and observability

- `/api/health`: basic health.
- `/api/health/detailed`: component checks/details.
- `/api/health/version`: version/build metadata.
- `/api`: supported endpoint index.
- `/api-docs` and `/api-docs.json`: documentation when Swagger is enabled.

Use request IDs to correlate errors across API logs. Do not log JWTs, cookies, passwords, provider secrets, or full private profiles. A successful HTTP response does not prove email delivery, OAuth callback success, upstream ingestion, or authorized database recovery.

## Release verification

Run unit tests, types/builds, lint, and browser checks using the [Development validation workflow](DEVELOPMENT.md#validation-workflow). Separately verify on authorized staging infrastructure:

- Migration status and actual schema match.
- Catalogue populated with intended semesters/classes/exam data.
- Application login, email verification/recovery, and enabled OAuth callbacks.
- Profile preferences and unknown-field filtering.
- Owned course-roadmap and preset save/load/delete flows.
- Community creation/voting/ownership and admin role restrictions.
- Actual API rewrite, HTTPS cookies, CORS, rate limits, health, and sync ownership.

## Recovery

For a failed app-only release, restore the previous compatible application artifact/configuration and verify health. For schema/data changes, use the tested backup/recovery procedure; rolling back source alone does not restore dropped data. Never reset a live database to work around migration drift.

For failed ingestion, preserve the last stored data, diagnose source/contract/configuration errors, and rerun only against the authorized target. For browser state problems, offer export/save before clearing site data. Catalogue, email, OAuth, and cache incidents have different dependencies; inspect the actual failing path.
