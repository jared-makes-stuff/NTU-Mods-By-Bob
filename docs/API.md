# API Reference

## Addressing and response conventions

The backend API prefix is `/api`, on port 3111 in the example configuration. Browser clients normally call frontend `/api` through the Next.js rewrite. Set `BACKEND_API_URL` to a backend address that already includes `/api`.

Most successful controllers wrap results in `{ "data": ... }`. Auth responses can contain user/token fields inside that wrapper. Catalogue list endpoints additionally return pagination. Runtime details are in route/controller source; some error paths return a plain error/message rather than the central structured form.

The structured error middleware uses an error code, message, and timestamp. Handle HTTP status first, then use the frontend error-normalization helpers rather than assuming all endpoints share one JSON shape.

When enabled, Swagger UI is served at `/api-docs`, with raw JSON at `/api-docs.json`. JSDoc/OpenAPI annotations are maintained in backend source. They are references, not a substitute for executing authorization and payload checks.

## Authentication and permissions

Browser auth supports `access_token` / `refresh_token` HTTP-only cookies. API clients can send `Authorization: Bearer <access-token>`. The frontend request client sends cookies and can refresh/retry a failed authenticated request once. Refresh tokens may be supplied in cookies or supported request bodies.

- Public: catalogue reads, review/topic reads, account-entry/recovery/config routes, health, API index.
- Authenticated: profile/account mutations, course plan, presets, generation, votes, user settings.
- Student-domain restriction: new reviews/topics require an `e.ntu.edu.sg` email, as enforced in the content route middleware.
- Ownership: saved presets and content mutations apply service ownership/role rules.
- Administrative: user listing and role updates require permitted administrator roles. Admins cannot modify/assign admin/superadmin roles; superadmins cannot modify another superadmin or assign that role through this endpoint.

Group-level auth can affect unmatched paths before later routers. Test effective runtime behavior, especially anonymous requests, when changing ordering.

## Account endpoints

All paths below are relative to `/api/auth`.

| Method | Path | Purpose / input |
| --- | --- | --- |
| POST | `/register` | Name, email, password; initiates verification |
| POST | `/login` | Application email/password |
| POST | `/verify-email` | Email and verification code |
| POST | `/verify-email/resend` | Request another verification code |
| POST | `/password/forgot` | Initiate password recovery |
| POST | `/password/reset` | Email, code, new password |
| POST | `/refresh` | Refresh cookie or optional refreshToken body |
| POST | `/logout` | End application session/clear cookies |
| GET | `/config` | Available OAuth provider configuration |
| POST | `/google`, `/github` | Exchange an OAuth authorization code |
| GET | `/google/callback`, `/github/callback` | Backend callback redirection |
| GET / PUT | `/me` | Read/update authenticated profile |
| POST | `/avatar` | Multipart upload using field `avatar` |
| POST | `/email-change/request` | New email and current password |
| POST | `/email-change/verify` | Confirm pending change with code |
| POST | `/email-change/revert` | Revert token flow; see source validation |
| POST | `/change-password` | Current password and new password |
| POST | `/create-password` | Create password for an eligible OAuth account |
| DELETE | `/account` | Delete authenticated account; password required when one exists |
| POST | `/oauth/link/google`, `/oauth/link/github` | Link provider using authorization code |
| DELETE | `/oauth/link/:provider` | Unlink an eligible provider |

Profile settings update example:

```json
{
  "name": "Example Student",
  "settings": {
    "theme": "dark",
    "language": "en",
    "defaultSemester": "2026_1",
    "preferences": { "compactView": true, "show24HourTime": true }
  }
}
```

`themeColor`, `theme`, `language`, `defaultSemester`, and the three supported nested UI preferences are the entire profile settings contract. Recognized invalid request values return HTTP 422; unknown keys are stripped. Reading malformed/older stored settings keeps valid supported fields, including valid neighboring nested preferences. Read/update responses use `{ "data": { "user": ... } }`. Password hashes are not returned; `hasPassword` indicates account capability.

## Catalogue endpoints

| Method | Path relative to `/api` | Purpose |
| --- | --- | --- |
| GET | `/modules` | Filtered paginated catalogue |
| GET | `/modules/search` | Quick module search |
| GET | `/modules/search-all` | Search across stored semesters |
| GET | `/modules/stats` | Catalogue counts/statistics |
| GET | `/modules/:code` | Module details; latest matching stored semester |
| GET | `/modules/:code/indexes` | Class sessions; optional semester |
| GET | `/modules/:code/prerequisites` | Prerequisite checking/read interface |
| GET | `/modules/:code/dependencies` | Modules dependent on the selected module |
| GET | `/schools` | Available schools |
| GET | `/semesters` | Supported recent stored semesters |
| GET | `/semesters/current` | Current semester selection |

List filters include search, school, AU range, semester, level, elective/grading, day, class-type, and exam options as defined by catalogue types/routes. Pagination supports page/limit and permitted sort fields. Check `backend/src/api/routes/catalogue/modules.routes.ts` and `catalogue/filters.ts` for exact accepted query keys and normalization rather than inventing new aliases.

Indexes include index number, class type, day, start/end time, venue, group, weeks, semester, and module code as returned by the relevant endpoint. Missing module/index data can produce 404. Catalogue data is persisted, and its freshness depends on ingestion.

## Course roadmap

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/plan` | Read the authenticated user's roadmap; empty default if absent |
| POST | `/api/plan` | Upsert that user's module list and optional metadata |

Example save payload:

```json
{
  "modules": [
    {
      "id": "example-entry",
      "code": "SC1003",
      "name": "Example module",
      "au": 3,
      "year": 1,
      "semester": 1,
      "status": "PLANNED",
      "remarks": "Personal planning note"
    }
  ],
  "metadata": { "view": "table" }
}
```

Persisted rows can include ID/user ID/timestamps. An empty default has only modules and metadata, and the frontend accepts both forms. Module fields and metadata still use permissive JSON validation in places; do not assume this endpoint validates institutional eligibility or every module field. A user ID in the body is not the ownership source: the authenticated request identity is.

## Presets and generation

| Method | Path | Behavior |
| --- | --- | --- |
| GET / POST | `/api/timetables` | List/create owned named presets |
| GET / PUT / DELETE | `/api/timetables/:id` | Read/update/delete owned preset |
| POST | `/api/timetables/:id/modules` | Add supported selection |
| DELETE | `/api/timetables/:id/modules/:moduleCode` | Remove selected module |
| GET | `/api/timetables/:id/conflicts` | Inspect preset conflicts |
| POST | `/api/timetables/generate` | Planner-service generation interface |
| POST | `/api/timetable/generate` | Combination generation from modules, filters, semester |
| POST | `/api/timetable/validate` | Validate supported timetable request/result |

Do not interchange the two generation payloads. For combination generation, module entries use `code` and candidate `indexNumbers`, a `semester` is supplied, and filters follow `backend/src/api/validators/timetable` and `frontend/src/shared/types/timetableGeneration.ts`. Results include combinations, counts, `hasMore`, generation timestamp, scores, class data, and schedule statistics as specified in client schemas.

The browser timetable screen uses its own generator with loaded catalogue sessions; it does not depend on calling either backend generator for every action. Named preset creation trims names and rejects an existing case-insensitive name for that user.

## Community content

For `/api/modules/:moduleCode/reviews` and `/api/modules/:moduleCode/topics`:

| Method | Suffix | Behavior |
| --- | --- | --- |
| GET | collection | List visible/unflagged content |
| POST | collection | Create authorized student contribution |
| PUT | `/:reviewId` or `/:topicId` | Edit permitted content |
| DELETE | `/:reviewId` or `/:topicId` | Delete permitted content |
| POST | `/:reviewId/vote` or `/:topicId/vote` | Vote under service rules |

Reviews accept a rating from 1 to 5, optional content, assessment weighting, and term. The review service rejects a second review for the same normalized module/user pair. Topic-specific shape and edit/vote rules are defined in the corresponding controller/service. Do not infer moderation permissions from UI visibility alone.

## Users and health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/user/:userId/avatar` | Stored avatar response; effective anonymous reachability depends on router order |
| GET / PUT | `/api/user/settings` | Existing name/account-summary interface; distinct from profile UI preferences |
| GET | `/api/user` | Administrator user list |
| PATCH | `/api/user/:userId/role` | Authorized role change |
| GET | `/api/health` | Basic health |
| GET | `/api/health/detailed` | Component health details |
| GET | `/api/health/version` | Version/build metadata |
| GET | `/api` | Supported API index |

## Compatibility and maintenance

The browser timetable route is `/timetable-planner`; older feature URLs are not retained as compatibility pages. JWT issuer/audience labels now identify this application. Existing token-verification behavior has not been expanded into stricter claim checking.

Use schema generation and forward migrations for persistence changes, and update callers/tests/OpenAPI/PRD together for contract changes. Runtime OpenAPI includes the course-roadmap endpoints and explicit profile preference schema. See [Operations](OPERATIONS.md) for the unapplied cleanup migration and production migration/recovery limits.
