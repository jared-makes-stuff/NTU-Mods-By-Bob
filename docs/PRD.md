# Product Requirements: NTU Mods by Bob

| Field | Value |
| --- | --- |
| Product | NTU Mods by Bob |
| Version | Planning-focused baseline, 1.0 |
| Updated | 2026-10-01 |
| Owner | Repository maintainer |
| Authority | Product scope and acceptance criteria for the checked-in application |
| Status | Implemented baseline with validation and operational limits recorded below |

## 1. Problem

Students need to compare modules, plan several semesters, and choose class combinations without disconnected spreadsheets and repeated catalogue searches. Module information, schedule choices, personal annotations, and community feedback should be available in one workspace.

The product supports decisions using catalogue data and user inputs. It does not claim that a suggested plan guarantees eligibility, enrollment, official academic standing, or a particular academic outcome.

## 2. Users and needs

| User | Need | Successful outcome |
| --- | --- | --- |
| Visitor | Explore modules and try planning with minimal friction | Finds module information and creates a browser-local plan |
| Student planner | Organize modules and compare schedules | Maintains a roadmap and selects a suitable timetable |
| Account holder | Keep plans across devices | Saves a roadmap and named presets with application authentication |
| Student contributor | Share experience and module topics | Publishes permitted content and maintains their submissions |
| Administrator | Manage account access | Lists users and makes only permitted role changes |
| Maintainer | Keep data and deployments reliable | Configures, tests, builds, migrates, and diagnoses documented components |

## 3. Goals and success measures

1. Combine module discovery and class inspection with planning.
2. Preserve manual roadmap editing, CSV portability, grades, remarks, and AU totals.
3. Generate and compare class-index combinations using explicit schedule preferences.
4. Support browser-local and account-backed persistence with visible loading/save/error states.
5. Preserve authentication, ownership checks, contribution permissions, and administrator boundaries.
6. Maintain one navigable documentation set grounded in current implementation.

Acceptance is measured by observable workflows and executed checks. Adoption, planning time, error rate, and infrastructure latency have no measured baseline here; future numerical targets require instrumentation and representative measurement. This PRD establishes no production service-level commitment.

## 4. Scope and exclusions

### Included

- Catalogue search/filters, details, schools, semesters, prerequisites, dependencies, classes, and supplied exam metadata.
- Manual multi-semester roadmaps, catalogue/custom modules, elective placeholders, grades, remarks, completion status, AU totals, and estimated GPA.
- Timetable index selection, weekly display, preference-based generation, comparison, custom events, presets, and image export.
- Application accounts, email verification/recovery, UI preferences, avatars, and optional Google/GitHub OAuth.
- Module reviews, topics, voting, role-controlled user administration, catalogue ingestion, caching, health, and API documentation.

### Excluded

- University credential collection, storage, verification, session relay, or impersonation.
- Enrollment transactions, university-account index swaps, and registration automation.
- Official student-record access, academic-record PDF production, and automated academic eligibility/completion checking.
- Live seat scraping and registration-status monitoring.
- Payments, subscriptions, guaranteed notifications, and unsupported public-sharing workflows.
- External deployment/live-database changes during local implementation.

Existing role labels remain compatibility identifiers; they do not establish a billing product.

## 5. User journeys

### J1: Discover a module

Open `/module-info`, search code/name and supported filters, select a result, and inspect metadata, prerequisite relationships, indexes, reviews, and topics. Empty results, missing classes, unavailable metadata, and failed requests must be distinguishable.

### J2: Build a roadmap

Open `/course-planner`, add catalogue/custom entries, assign year/semester, and edit AU, grade, remarks, and status. Use elective placeholders for undecided modules. Inspect totals and estimated GPA, remove selected rows, and import/export CSV. Sign in to load/save the account's single roadmap. A new account receives an empty plan.

### J3: Compare timetables

Open `/timetable-planner`, choose semester/modules, inspect indexes, select candidates, and set schedule preferences. Generate and compare results, apply one to module selections, add custom events, and export an image. Sign in to save/load named presets.

The current browser planner generates locally. Backend generation APIs are separate supported interfaces; full parity remains unverified. Custom events display in the planner, but generation input currently consists of module classes; automatic avoidance of custom events is not established.

### J4: Contribute and manage an account

Use application login or configured OAuth. Verify email where required, edit profile/avatar/preferences, maintain linked providers, and use password/email recovery. Permitted student accounts create reviews/topics. Users maintain their own content under service authorization rules; administrators use restricted user management.

## 6. Functional requirements

P0 = essential baseline; P1 = retained supporting capability; P2 = future improvement requiring separate implementation.

| ID | Priority | Requirement | Implementation / evidence source |
| --- | --- | --- | --- |
| CAT-01 | P0 | Search/filter persisted catalogue records with pagination and loading/empty/error states | Catalogue routes/services; module-info feature |
| CAT-02 | P0 | Show metadata and semester-specific class indexes | Catalogue lookup; module detail UI |
| CAT-03 | P1 | Show prerequisites/dependencies and supported relationship graphs | Prerequisite services and frontend graph |
| CAT-04 | P1 | Expose schools/semesters and supplied exam metadata | Catalogue routes; ingestion mapper |
| CRS-01 | P0 | Add/edit/move/delete modules across semesters | Course hook, store, and timeline |
| CRS-02 | P1 | Support custom entries and MPE/BDE/UE placeholders | Planned-module transforms and dialogs |
| CRS-03 | P1 | Calculate AU totals and estimated GPA from entered grades | Course utility calculations |
| CRS-04 | P1 | Import/export documented CSV without an upstream student account | CSV utilities and sidebar |
| CRS-05 | P0 | Persist guest roadmaps locally and account roadmaps through `/api/plan` | Zustand and plan API/service |
| CRS-06 | P0 | Accept the empty plan returned for an account without saved data | Service defaults; frontend API regression |
| TT-01 | P0 | Select semester/modules/indexes and display classes by day/time/week | Timetable feature and shared grid |
| TT-02 | P0 | Generate bounded combinations and show no-match results | Browser combination builder/generator |
| TT-03 | P1 | Apply supported day/time, duration/gap, class-type, venue, load, and ranking preferences | Generation filters and UI |
| TT-04 | P1 | Compare results and apply a selected result | Generation hooks |
| TT-05 | P1 | Add/edit/remove custom events and retain supported preset data | Planner store; preset hooks |
| TT-06 | P1 | Save/load/delete owned named presets and reject duplicate names | Timetable services and dialogs |
| TT-07 | P1 | Export the displayed timetable image | Screenshot hook; html-to-image |
| ACC-01 | P0 | Preserve application auth, refresh/logout, verification, and recovery | Auth routes/services/middleware |
| ACC-02 | P0 | Accept/expose only supported UI settings; do not return unknown stored fields | Preference schema, sanitizer, tests |
| ACC-03 | P1 | Support avatars, email/password changes, deletion, configured OAuth linking | Profile/account/OAuth services |
| COM-01 | P1 | Show unflagged reviews/topics and authorize mutations/votes | Content routes/services |
| COM-02 | P0 | Require the configured student-email domain for new submissions | Email-domain route middleware |
| ADM-01 | P0 | Enforce user-management role restrictions on the server | User service and role middleware |
| OPS-01 | P0 | Fail startup on missing/invalid required configuration | Backend env schema; frontend config |
| OPS-02 | P1 | Ingest catalogue on the configured schedule and invalidate catalogue cache | API strategy; sync job |
| OPS-03 | P1 | Expose health/version and optional OpenAPI for supported domains | Health routes; API index; OpenAPI |
| DOC-01 | P0 | Consolidate references under `docs/` with one index and PRD | Documentation index and linked references |

## 7. Data and integration requirements

- PostgreSQL is authoritative for users, modules/indexes, course plans, timetable presets, and community content.
- One course-plan row exists per user. Supported payload: modules plus optional metadata; saves upsert by authenticated user ID.
- Saved timetable access uses resource ID and owner ID. Creation checks names case-insensitively per account.
- Catalogue ingestion uses a configured service with health, semesters, content, schedules, and optional exam data. Normalize data at ingestion.
- Catalogue reads use persisted records with optional Redis. Real data requires a configured/populated database.
- Profile settings: `themeColor`, `theme`, `language`, `defaultSemester`, and `preferences` (`compactView`, `show24HourTime`, `showWeekends`). Unknown keys are discarded; invalid recognized request fields fail validation.
- Browser account-state upgrade invalidates older persisted profiles once, then reloads the account. The roadmap version upgrade immediately rewrites older storage with supported modules, metadata, and the saved-module snapshot; unsupported fields are removed before a user edits.
- Migration history is immutable. Schema cleanup uses a forward migration; live execution requires backup and operator authorization.

## 8. Nonfunctional requirements

### Security/privacy

Preserve bcrypt hashing, JWT signature/expiry checks, HTTP-only browser cookies, bearer-token support, rate limits, CORS, validation, and server-side roles/ownership. Do not introduce third-party credential fields. Secrets belong in runtime configuration, never public frontend variables, logs, examples, or docs.

The token helper still supports localStorage bearer tokens; cookie support does not make every client path cookie-only. Reducing token exposure is separate work. Profile read/update sanitization protects responses before the live cleanup migration executes.

### Usability/accessibility

Keep routes, navigation, dialogs, keyboard interactions, and loading/empty/error states usable. Preserve responsive layouts, reusable UI primitives, and theme support. Comprehensive accessibility conformance is not audited; future UI changes require keyboard and assistive-technology checks.

### Performance/reliability

Bound generation and avoid promising exhaustive optimization. The browser generator returns at most 100 results. Preserve cache TTLs, deduplicated reads, configurable request timeouts, visible save failures, and data-freshness limits. Large-module and ingestion performance need representative measurement.

### Maintainability

Keep routes thin, features cohesive, network calls in shared API/data layers, and backend HTTP handling separate from services/ingestion. Use existing npm workspaces/lockfile. Distinguish observed behavior from unvalidated requirements.

## 9. Acceptance criteria

| ID | Observable acceptance | Verification |
| --- | --- | --- |
| AC-01 | Only supported feature paths, API domains, navigation, and environment fields remain | Content/path scan; API-surface test; build route inventory |
| AC-02 | `/timetable-planner` renders and generation remains available | Playwright catalogue/index search, generation, and result selection; frontend build |
| AC-03 | Roadmap editing/save tracking survives removal of completion targets | Course store tests; type check |
| AC-04 | New-account empty plans parse and malformed responses fail | Frontend plan API tests |
| AC-05 | Profiles keep supported settings and omit unknown fields/password hashes | Backend preference/profile tests; isolated real HTTP/database checks |
| AC-06 | Older roadmap state is rewritten with supported fields before editing; account persistence upgrades safely | Persistence regression tests; Playwright storage-upgrade flow |
| AC-07 | Retained authentication/catalogue/timetable regressions stay covered | Workspace unit suites |
| AC-08 | Docs links and source references resolve; examples match code; duplicate docs are retired | Documentation audit and diff review |
| AC-09 | Both workspaces type-check/build; lint failures are reported without weakening checks | Repository scripts; recorded evidence |
| AC-10 | Schema validates and forward migration exists without altering applied history | Prisma validation; isolated clean/upgrade database tests; production execution deferred |

Local validation passed 61 unit tests, five browser tests, 22 actual HTTP/database checks, workspace type checks/builds, and isolated migration checks. Frontend lint still has four pre-existing errors in unchanged files. Local passing tests do not prove production migration, upstream connectivity, email delivery, OAuth exchange, or deployment. See the [Development validation workflow](DEVELOPMENT.md#validation-workflow) for commands.

## 10. Known gaps

- Real catalogue/saved-plan workflows need a database; unit tests mock persistence.
- The migration chain matches the current schema in isolated PostgreSQL. Production deployment and backup/restore behavior require environment-specific verification.
- Browser/API generators have separate implementations without a full parity suite.
- Course module/metadata validation remains loose in places; strengthen both API sides together later.
- Semester listing filters stored indexes by the current host year; older semesters may be omitted.
- Group-level authentication can run before later route groups even for unmatched paths; verify effective HTTP behavior when changing order.
- Preset loading can skip unavailable modules rather than report every reconciliation error.
- Configured limits/flags are not proof of uniform enforcement; inspect their callers before relying on them.
- Current automated checks do not constitute a full account, community, accessibility, or production integration audit.

## 11. Future priorities

| Priority | Candidate | Exit evidence | Status |
| --- | --- | --- | --- |
| P0 | Verify production migration and recovery | Staging upgrade and backup/restore exercise | Local clean/upgrade tests passed; production checks deferred |
| P1 | Strengthen course-plan validation | Valid/malformed/negative/owner-isolation cases | Deferred |
| P1 | Verify generation parity and custom-event constraints | Shared browser/API fixtures | Deferred |
| P1 | Broaden account/catalogue/preset/contribution E2E | Deterministic UI plus isolated infrastructure | Planning UI fixtures and isolated persistence/ownership checks passed; wider coverage deferred |
| P1 | Audit token exposure and effective routing | Security review and anonymous/authenticated HTTP tests | Deferred |
| P2 | Measure accessibility, latency, freshness, and planning friction | Baseline followed by agreed targets | Proposed |

Future priorities do not authorize implementation or external changes. Approve and record new requirements before expanding scope.
