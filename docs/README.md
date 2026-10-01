# Documentation

These documents describe the current planning application. The PRD owns product intent; code and executed checks establish observed behavior. A requirement does not by itself prove runtime validation.

| Document | Audience | Owns |
| --- | --- | --- |
| [PRD](PRD.md) | Product and engineering | Problem, users, scope, requirements, acceptance criteria, gaps, priorities |
| [Architecture](ARCHITECTURE.md) | Engineering | Component boundaries, source map, data flows, persistence |
| [API](API.md) | Contributors | Endpoints, authentication, payloads, errors, compatibility |
| [Development](DEVELOPMENT.md) | Contributors | Setup, configuration, commands, tests, troubleshooting |
| [Operations](OPERATIONS.md) | Maintainers | Builds, migration safety, runtime services, release checks, recovery |
| [Project context](PROJECT_CONTEXT.md) | Future contributors | Concise technical handoff and authoritative source map |

## Reading paths

- New contributor: Development → Architecture → relevant API and PRD requirements.
- Behavior change: PRD → source/tests → affected references → updated validation evidence.
- Release: Operations → Development validation workflow → product acceptance criteria.

## Maintenance

The maintainer of a change owns its documentation update. Update the PRD when product intent, scope, constraints, or status changes. Update references for API, schema, configuration, route, test, and operational changes. Keep `.env.example` synchronized with typed configuration and avoid duplicate workspace setup docs.

The baseline was assessed on 2026-10-01. This date identifies local source review, not a deployed release. Historical database migrations remain immutable operational records.
