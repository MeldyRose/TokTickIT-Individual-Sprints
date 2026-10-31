# Lab 4 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.6 Flash)

## Selected Key Prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| **1** | Prior to writing any production code, I asked the AI to analyze all Sprint 4 issues and requirement specifications without modifying existing code, formulating a formal Test-Driven Documentation (Test-DD) roadmap covering parent-child Actions Taken, Resolution Gate enforcement, OCC, and dual Operations & Requester Dashboards. | I verified the proposed architecture, mapped every Acceptance Criterion (AC-01 through AC-18) in `tests.md`, and locked in the UI/API contracts before beginning branch implementation. |
| **2** | I instructed the AI to evolve the Prisma schema additively with the child model `ActionTaken` (indexes on `ticketId` and `performerId`, cascading delete), resolution columns on `Ticket` (`resolvedAt`, `closedAt`, `resolutionSummary`), and draft a verified reversible rollback down-migration script (`rollback.sql`). | I executed the additive migration, verified reversible down-migration rollback in `migration.test.ts`, and updated the idempotent seed script with diverse tickets having 0, 1, and multiple Actions Taken. |
| **3** | I prompted the AI to design the Optimistic Concurrency Control (OCC) logic on ticket and action mutation endpoints to prevent lost updates without introducing race conditions, ensuring role-based authorization is evaluated prior to OCC timestamp checks. | I implemented atomic `updateMany` queries matching `{ id, updatedAt: expectedUpdatedAt }`, returning structured HTTP `409 Conflict` with code `STALE_UPDATE` whenever concurrent collisions occur. |
| **4** | I asked the AI to design the Resolution Gate validation handler when transitioning tickets to `RESOLVED` or `CLOSED`, returning structured HTTP `422 Unprocessable Entity` error diagnostics when criteria ($\ge 1$ Action Taken, summary $\ge 10$ characters) are unsatisfied. | I connected the Express 422 diagnostic payload array (`MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`) to a real-time reactive checklist inside `StatusTransitionModal.tsx`, disabling the confirmation button until all prerequisites are fulfilled. |
| **5** | I requested authoritative backend aggregation queries for `GET /api/dashboard/staff` and `GET /api/dashboard/requester` calculating 7 IT Staff KPIs, workload counts, requester-scoped ticket summaries, and guarding against division-by-zero when zero tickets were resolved in the reporting window. | I implemented `dashboardUtils.ts` with safe zero-division calculations, indexed status/ownership Prisma counts, and verified sub-200ms query performance in automated integration tests. |
| **6** | I prompted the AI to resolve React state synchronization issues where clicking KPI cards on the Staff Dashboard or Requester Dashboard navigates to pre-filtered queues while retaining filter state across browser back/forward and tab navigation. | I implemented bidirectional query parameter serialization (`/tickets?status=...&resolvedRange=...`) and location listener handling in `App.tsx` and `Header.tsx` to preserve filter lifecycle and active tab highlights. |
| **7** | I instructed the AI to write full-spectrum Playwright E2E suites (`e2e/lab-04/`) testing multi-role browser journeys: IT Staff adding/editing actions, Requester viewing read-only, Requester advisory resolution, Staff formal resolution gate checklist, and dashboard drill-down filtering. | I executed the test suites against a seeded PostgreSQL test database, verified robust element test IDs, and achieved a 100% pass rate across all Lab 4 E2E test specs. |
| **8** | I asked the AI to automate responsive visual inspection across Desktop ($\ge 992\text{px}$), Tablet ($768\text{px}-991\text{px}$), and Mobile ($< 768\text{px}$) viewports, programmatically asserting zero horizontal scroll ($w \le 100\text{vw}$) and capturing evidence screenshots. | I ran `capture-lab4-screenshots.spec.ts`, verified no horizontal overflow across all viewports, verified keyboard focus rings (`2px solid #006B3C`), and organized 18 screenshot artifacts into `artifacts/lab-04/screenshots/`. |

---

## My Reflection

Pair-programming with AI across Lab 4's multi-layered requirements reinforced several critical software engineering principles, particularly when dealing with distributed state, transactional integrity, and responsive design systems:

1. **Contract-First Documentation Prevents Architectural Drift:**
   Investing time upfront to define strict API contracts (`api-spec.md`), UI wireframes (`ui-spec.md`), and an exhaustive traceability matrix (`tests.md`) before writing code was instrumental. When prompting the AI for individual backend endpoints or UI components, referencing specific contract sections (e.g. "BR-11 Resolution Gate" or "BR-16 OCC STALE_UPDATE") prevented the model from hallucinating schema changes or inventing ad-hoc response envelopes.

2. **Guarding Against Subtleties in Concurrent Systems:**
   Handling optimistic concurrency control (OCC) highlighted why automated AI suggestions require rigorous human review. The initial pattern suggested by the AI attempted an in-memory comparison of `updatedAt` after fetching the record, which would have introduced a classic Time-of-Check to Time-of-Use (TOCTOU) race condition. Prompting the AI to rethink this into an atomic database operation (`updateMany` with `{ id, updatedAt: expectedUpdatedAt }`) ensured true transactional isolation and correct HTTP 409 handling.

3. **Domain Boundary Separation & Role Scoping:**
   Lab 4 required nuanced role permissions—such as decoupling the Action Taken performer from overall ticket ownership, or allowing Requesters to advise that a problem appears resolved without giving them permission to formally mark it `RESOLVED`. Directing the AI to enforce authorization checks *before* concurrency or mutation checks ensured clean security boundaries and prevented unauthorized disclosure of operational metadata.

4. **Automating Inspection Beats Manual Verification:**
   Writing an automated Playwright inspection script to sweep viewports (1280px, 820px, 375px) and programmatically verify `scrollWidth <= clientWidth` was vastly more reliable than manual spot-checking. It caught subtle table wrapping and button group overflows immediately during development, allowing instant CSS grid and flexbox refinements before release.

5. **Balanced AI Collaboration:**
   While the AI dramatically accelerated repetitive boilerplate tasks—such as building seed fixtures, composing component mock tests, and writing CSS media query wrappers—the ultimate responsibility for architectural coherence, security invariants, and release quality remained firmly with the engineer.
