# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy

This test plan follows a **Test-Driven Documentation (Test DD)** methodology, defining comprehensive test specifications, boundary conditions, authorization rules, and end-to-end user journeys derived directly from the Sprint 4 engineering contract and Lab 4 handout requirements before code implementation begins. When development begins, implementation will proceed according to strict **Test-Driven Development (TDD)**: writing failing automated test suites first, writing minimal production code to satisfy assertions, and refactoring while maintaining 100% test pass rates across all suites.

The Lab 4 test suite spans nine specialized testing levels:
1. **Unit Testing:** Validates pure business logic in isolation: KPI metric calculations with safe zero division, Action Taken field validation (including conditional follow-up note rules), and status transition matrix rules.
2. **API & Security Integration:** Verifies REST endpoint contracts, role-based authorization (`401`/`403`), Requester ownership scoping on Actions Taken, and HTTP `422` error structures for Resolution Gate failures.
3. **Concurrency Testing:** Validates optimistic concurrency control (OCC) across ticket and action mutation endpoints, verifying that stale `expectedUpdatedAt` timestamps trigger HTTP `409 Conflict` (code `STALE_UPDATE`).
4. **Performance Smoke Testing:** Verifies dashboard metric aggregations and queue response times under synthetic load (verifying response latencies remain $< 200\text{ms}$).
5. **Database Migration & Rollback Testing:** Verifies additive schema evolution and executes a clean down-migration rollback script without data corruption.
6. **UI Component Testing:** Verifies React component rendering, state transitions, modal dialog behaviors, field validation, and checklist states for Staff Dashboard, Requester Dashboard, Actions Taken feed & modals, and Resolution Gate confirmation modals.
7. **Accessibility & Style Testing (a11y):** Verifies WCAG AA accessibility, visible `2px solid #006B3C` focus rings, ARIA roles, and Zen Green design tokens.
8. **Responsive Testing:** Verifies responsive layout transformations across Desktop ($\ge 992\text{px}$), Tablet ($768\text{px}-991\text{px}$), and Mobile ($< 768\text{px}$) viewports with zero horizontal scrolling.
9. **End-to-End (E2E) Testing:** Validates full multi-role browser journeys using Playwright, covering staff action creation and editing, requester read-only viewing, dashboard metric drill-downs, gated resolution, and concurrency collision feedback.

---

## 2. Planned Tests

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Initial Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-17, BR-21, FR-21 | Dashboard KPI calculation & safe zero division | Calculates average resolution time in minutes correctly; returns `0` when zero tickets resolved | `server/tests/lab-04/dashboardMetrics.test.ts` | Planned |
| **UNIT-02** | Unit | BR-02..04, FR-04 | Action Taken validation & conditional follow-up note | Rejects missing `followUpNote` when `followUpRequired=true`; passes valid payload | `server/tests/lab-04/actionValidation.test.ts` | Planned |
| **UNIT-03** | Unit | BR-10, FR-11 | Ticket status transition matrix logic | Validates permitted transitions; rejects invalid jumps (e.g. `NEW` $\rightarrow$ `CLOSED`) with `400` | `server/tests/lab-04/statusMatrix.test.ts` | Planned |
| **API-01** | API | AC-01, FR-01, BR-02 | Create Action Taken `POST /api/tickets/:id/actions` | Creates action line with Date/Time, Description, Result, Performer; returns `201 Created` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-02** | API | AC-02, BR-03 | Create Action Taken missing conditional follow-up note | Returns `400 Bad Request` with detail highlighting missing `followUpNote` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-03** | API | AC-03, FR-10, BR-09 | Create Action Taken with `claimTicket: true` on unassigned ticket | Creates action and updates ticket `ownerId` to authenticated user | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-04** | API | AC-04, FR-03, BR-05 | Update Action Taken `PATCH /api/tickets/:id/actions/:actionId` | IT Staff updates description, result, follow-up note; returns `200 OK` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-05** | API | AC-06, FR-05, BR-06 | Requester views Actions Taken on owned ticket `GET /api/tickets/:id/actions` | Returns `200 OK` with list of actions taken by IT staff on owned ticket | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-06** | API | AC-07, FR-06..07 | Requester mutation and unowned ticket action restriction | Requester calling `POST`/`PATCH` or requesting unowned ticket actions receives `403 Forbidden` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-07** | API | AC-08, BR-08 | Action performer autonomy & ticket owner preservation | Non-owner staff logs action; performer is recorded without altering ticket `ownerId` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-08** | API | AC-09, BR-11, FR-11 | Resolution Gate rejection on missing Actions Taken | Status transition to `RESOLVED` on ticket with 0 actions returns `422` (`MISSING_ACTION_TAKEN`) | `server/tests/lab-04/resolution-gate.api.test.ts` | Planned |
| **API-09** | API | AC-10, BR-12, FR-12 | Resolution Gate rejection on missing resolution summary | Status transition to `RESOLVED` missing summary returns `422` (`MISSING_RESOLUTION_SUMMARY`) | `server/tests/lab-04/resolution-gate.api.test.ts` | Planned |
| **API-10** | API | AC-11, BR-10, BR-14 | Successful Resolution Gate passage & status update | When actions $\ge 1$ and summary provided, status updates to `RESOLVED`, stamps `resolvedAt`, returns `200` | `server/tests/lab-04/resolution-gate.api.test.ts` | Planned |
| **API-11** | API | AC-12, FR-14..15 | Staff Dashboard Metrics & Recent Tickets `GET /api/dashboard/staff` | Returns 7 KPI counts including "Owned by Me" and recent 10 tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-12** | API | AC-14, FR-17..18 | Requester Dashboard `GET /api/dashboard/requester` | Returns active tickets, waiting for my input count, and recent activity scoped to user | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **CONC-01** | Concurrency | AC-05, BR-16, FR-20 | Optimistic concurrency control on ticket & action updates | Stale `expectedUpdatedAt` payload triggers `409 Conflict` (code `STALE_UPDATE`) | `server/tests/lab-04/concurrency.test.ts` | Planned |
| **PERF-01** | Perf Smoke | FR-14, FR-17 | Dashboard metrics query latency smoke test | Metrics aggregation queries execute in under 200ms on simulated database | `server/tests/lab-04/perf-smoke.test.ts` | Planned |
| **MIGR-01** | Migration | BR-23, FR-22 | Prisma schema migration & reversible rollback verification | Verifies additive migration creates `actions_taken` and down-migration cleanly reverts | `server/tests/lab-04/migration.test.ts` | Planned |
| **UI-01** | UI Comp | AC-12, AC-13, FR-14 | Staff Dashboard KPI cards, "Owned by Me" & Recent Tickets | Renders 7 metric cards, Recent Tickets table, and verifies drill-down navigation links | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-02** | UI Comp | AC-14, AC-15, FR-17 | Requester Dashboard cards & Action Required alert banner | Renders Active Tickets, Waiting for My Input banner, and verifies drill-down navigation | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-03** | UI Comp | AC-01..04, FR-01..03 | Actions Taken feed rendering, Create & Edit modal | Chronological timeline, action badges, follow-up flags, opens create/edit modal | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-04** | UI Comp | AC-06, FR-05 | Requester read-only Actions Taken view | Renders action feed on Requester Detail screen; hides all create/edit action controls | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-05** | UI Comp | AC-09..11, FR-11..13 | Resolution Gate modal verification checklist | Displays real-time checks; disables submit when prerequisites missing; enables on full criteria | `client/tests/lab-04/ResolutionGate.test.tsx` | Planned |
| **A11Y-01** | Style/A11y | AC-17 | WCAG AA compliance, focus rings & Zen Green tokens | Validates 2px focus rings (`#006B3C`), ARIA attributes, and color contrast $\ge 4.5:1$ | `client/tests/lab-04/Accessibility.test.tsx` | Planned |
| **RESP-01** | Responsive | AC-17 | Responsive layout adaptations across breakpoints | Desktop grid shifts to 2-column on tablet and 1-column cards on mobile (<768px) | `client/tests/lab-04/Responsive.test.tsx` | Planned |
| **E2E-01** | E2E | AC-12..15 | E2E Staff & Requester dashboard discovery and drill-down | Staff & Requester log in $\rightarrow$ view dashboards $\rightarrow$ click metric cards $\rightarrow$ verify filtered queues | `e2e/lab-04/dashboard-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-01..07 | E2E Actions Taken lifecycle (Staff create/edit & Requester read) | Staff logs action $\rightarrow$ updates action $\rightarrow$ Requester views action read-only | `e2e/lab-04/actions-management.spec.ts` | Planned |
| **E2E-03** | E2E | AC-09..11 | E2E Resolution Gate enforcement & resolution workflow | Staff attempts premature resolve (blocked) $\rightarrow$ logs action $\rightarrow$ adds summary $\rightarrow$ resolves | `e2e/lab-04/resolution-gate.spec.ts` | Planned |
| **E2E-04** | E2E | AC-05, BR-16 | E2E Concurrency stale update collision feedback | Simultaneous edit in two browser contexts triggers `409 Conflict` alert modal | `e2e/lab-04/concurrency-stale-update.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion defined in `docs/lab-04/specification.md` is 100% traceably mapped to planned automated test suites:

| AC ID | Acceptance Criterion Summary | Planned Automated Test File(s) | Planned Test ID(s) |
|---|---|---|---|
| **AC-01** | IT Staff logs valid Action Taken with all required fields | `server/tests/lab-04/actions.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-management.spec.ts` | `API-01`<br>`UI-03`<br>`E2E-02` |
| **AC-02** | Action Taken missing conditional follow-up note rejected (`400`) | `server/tests/lab-04/actionValidation.test.ts`<br>`server/tests/lab-04/actions.api.test.ts` | `UNIT-02`<br>`API-02` |
| **AC-03** | Log Action Taken with `claimTicket: true` assigns ownership | `server/tests/lab-04/actions.api.test.ts`<br>`e2e/lab-04/actions-management.spec.ts` | `API-03`<br>`E2E-02` |
| **AC-04** | IT Staff updates existing Action Taken (`PATCH`) | `server/tests/lab-04/actions.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-management.spec.ts` | `API-04`<br>`UI-03`<br>`E2E-02` |
| **AC-05** | Optimistic concurrency control rejects stale update (`409 Conflict`) | `server/tests/lab-04/concurrency.test.ts`<br>`e2e/lab-04/concurrency-stale-update.spec.ts` | `CONC-01`<br>`E2E-04` |
| **AC-06** | Requester views Actions Taken on owned ticket in read-only mode | `server/tests/lab-04/actions.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-management.spec.ts` | `API-05`<br>`UI-04`<br>`E2E-02` |
| **AC-07** | Requester blocked from action mutations and unowned tickets (`403`) | `server/tests/lab-04/actions.api.test.ts` | `API-06` |
| **AC-08** | Action performer autonomy & ticket owner preservation | `server/tests/lab-04/actions.api.test.ts`<br>`e2e/lab-04/actions-management.spec.ts` | `API-07`<br>`E2E-02` |
| **AC-09** | Resolution Gate blocks resolution when zero Actions Taken exist (`422`) | `server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGate.test.tsx`<br>`e2e/lab-04/resolution-gate.spec.ts` | `API-08`<br>`UI-05`<br>`E2E-03` |
| **AC-10** | Resolution Gate blocks resolution when resolution summary missing (`422`) | `server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGate.test.tsx`<br>`e2e/lab-04/resolution-gate.spec.ts` | `API-09`<br>`UI-05`<br>`E2E-03` |
| **AC-11** | Successful resolution when all Resolution Gate criteria are met | `server/tests/lab-04/statusMatrix.test.ts`<br>`server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGate.test.tsx`<br>`e2e/lab-04/resolution-gate.spec.ts` | `UNIT-03`<br>`API-10`<br>`UI-05`<br>`E2E-03` |
| **AC-12** | Staff Dashboard renders 7 KPI metric cards, "Owned by Me" & Recent Tickets | `server/tests/lab-04/staff-dashboard.api.test.ts`<br>`client/tests/lab-04/StaffDashboard.test.tsx`<br>`e2e/lab-04/dashboard-flow.spec.ts` | `API-11`<br>`UI-01`<br>`E2E-01` |
| **AC-13** | Staff Dashboard metric card click drills down to pre-filtered queue | `client/tests/lab-04/StaffDashboard.test.tsx`<br>`e2e/lab-04/dashboard-flow.spec.ts` | `UI-01`<br>`E2E-01` |
| **AC-14** | Requester Dashboard renders Active Tickets, Waiting Input & Recent Activity | `server/tests/lab-04/requester-dashboard.api.test.ts`<br>`client/tests/lab-04/RequesterDashboard.test.tsx`<br>`e2e/lab-04/dashboard-flow.spec.ts` | `API-12`<br>`UI-02`<br>`E2E-01` |
| **AC-15** | Requester Dashboard metric card click drills down to `/tickets` | `client/tests/lab-04/RequesterDashboard.test.tsx`<br>`e2e/lab-04/dashboard-flow.spec.ts` | `UI-02`<br>`E2E-01` |
| **AC-16** | Safe zero division when zero tickets are resolved in reporting window | `server/tests/lab-04/dashboardMetrics.test.ts`<br>`server/tests/lab-04/staff-dashboard.api.test.ts` | `UNIT-01`<br>`API-11` |
| **AC-17** | Fluid responsive layout adaptation on Desktop, Tablet, and Mobile | `client/tests/lab-04/Responsive.test.tsx`<br>`client/tests/lab-04/Accessibility.test.tsx` | `RESP-01`<br>`A11Y-01` |
| **AC-18** | Backward compatibility invariance and clean database rollback | `server/tests/lab-04/migration.test.ts`<br>`server/tests/lab-04/perf-smoke.test.ts` | `MIGR-01`<br>`PERF-01` |

---

## 4. Responsive and Visual Inspection Checklist

| Checkpoint | Target Viewport | Screen / Component | Acceptance Expectation |
|---|---|---|---|
| **CHK-01** | Desktop ($\ge 992\text{px}$) | `/staff/dashboard` | 7 KPI metric cards render in clean grid; Recent Tickets table displays all columns. |
| **CHK-02** | Desktop ($\ge 992\text{px}$) | `/dashboard` | 3 Requester metric cards render side-by-side with Action Required alert banner. |
| **CHK-03** | Tablet ($768\text{px}-991\text{px}$) | `/staff/dashboard` & `/dashboard` | Metric cards adapt to 2-column layout; Recent Tickets table compresses padding. |
| **CHK-04** | Mobile ($< 768\text{px}$) | Both Dashboards | Metric cards stack into 1 full-width column; figures scale cleanly without truncation. |
| **CHK-05** | Mobile ($< 768\text{px}$) | Actions Taken Feed | Action cards wrap content; timestamps, results, and badges align without overflow. |
| **CHK-06** | All Viewports | Metric Cards & Actions | Visible `2px solid #006B3C` focus ring on keyboard tab; card elevates on hover. |
| **CHK-07** | All Viewports | Resolution Gate Modal | Checklist displays green checkmarks for satisfied items and red warnings for missing items. |
| **CHK-08** | All Viewports | Global | Zero horizontal scrolling ($w \le 100\text{vw}$) across all viewports. |
