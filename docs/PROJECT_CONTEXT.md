# Project Context

## Current purpose

NTU Mods by Bob is a catalogue-backed, manually maintained course-roadmap and timetable-planning application with account persistence and module community content. The [PRD](PRD.md) owns product scope and acceptance criteria.

## Retained entry points

| Surface | Entry |
| --- | --- |
| Course roadmap | `frontend/src/app/(app)/course-planner/page.tsx` |
| Timetable planner | `frontend/src/app/(app)/timetable-planner/page.tsx` |
| Module discovery | `frontend/src/app/(app)/module-info/page.tsx` |
| Admin users | `frontend/src/app/(app)/admin/users/page.tsx` |
| Frontend API/rewrite | `frontend/src/shared/api`; `frontend/next.config.ts` |
| Backend composition | `backend/src/app.ts`; `backend/src/api/routes/index.ts` |
| Catalogue ingestion | `backend/src/data/strategy/external-api`; `backend/src/jobs/sync.job.ts` |
| Schema | `backend/prisma/schema.prisma` |
| Account preference boundary | `backend/src/business/services/auth/settings.ts`; `auth/profile.ts` |

## Technology and commands

Next.js 16 / React 19 / TypeScript / Tailwind 4 / Zustand / TanStack Query form the frontend. Express 5 / Prisma 6 / PostgreSQL form the backend; Redis is optional. Vitest covers unit regressions and Playwright covers browser fixtures. Resolved versions belong to `package-lock.json`.

Use npm workspaces from the root. `dev` starts the frontend only; run `dev:backend` separately. Example ports are 3000/3111. Both examples and runtime schemas must remain aligned. See [Development](DEVELOPMENT.md) for full configuration and commands.

## Decisions in the current baseline

- The timetable URL is `/timetable-planner` throughout source, navigation, and tests.
- Course roadmaps contain modules and optional metadata, with browser-local persistence and an account-owned backend upsert.
- Only explicit UI preferences enter/leave profile settings. Valid nested stored preferences survive invalid neighbors. Older account storage is invalidated once; the roadmap version upgrade immediately rewrites stored records with supported fields.
- A forward scope-reduction migration is supplied without changing applied historical migrations. Disposable PostgreSQL clean/upgrade checks passed; existing user/production execution is deferred.
- Product/developer/operator docs live under `docs/`; duplicate frontend/backend READMEs and the old nested frontend documentation are retired.
- Review rating display and ordinary course grade/AU calculations remain supported planning/community behavior.

## Evidence and limitations

The [PRD acceptance criteria](PRD.md#9-acceptance-criteria) and [Development validation workflow](DEVELOPMENT.md#validation-workflow) define local checks. Unit tests use synthetic example configuration and mocked persistence. Migration integration tests use disposable PostgreSQL. These checks did not change an existing user database, catalogue source, OAuth provider, SMTP transport, or production deployment.

Production migration/recovery, browser/API generation parity, custom-event avoidance during generation, strict roadmap payload validation, and effective route-order behavior remain documented gaps rather than completed work. See PRD sections 10–11 before planning follow-up implementation.

## Maintenance handoff

Inspect current code/tests before changing behavior. Update affected API/schema/configuration consumers and docs in the same change. Preserve secrets, ownership checks, and role restrictions. Keep applied migrations immutable and distinguish local validation from authorized external execution. The documentation index provides one reading path for each audience.
