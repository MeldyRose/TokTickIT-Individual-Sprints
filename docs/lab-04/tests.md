# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy

This test plan follows a **Test-Driven Documentation (Test DD)** methodology, defining comprehensive test specifications, boundary conditions, authorization rules, and end-to-end user journeys derived directly from the Sprint 4 engineering contract and Lab 4 handout requirements before code implementation begins. When development begins, implementation proceeds according to strict **Test-Driven Development (TDD)**: writing failing automated test suites first, writing minimal production code to satisfy assertions, and refactoring while maintaining 100% test pass rates across all suites.

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

## 2. Test Execution Matrix

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-17, BR-21, FR-21 | Dashboard KPI calculation & safe zero division | Calculates average resolution time in minutes correctly; returns `0` when zero tickets resolved | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| **UNIT-02** | Unit | BR-02..04, FR-04 | Action Taken validation & conditional follow-up note | Rejects missing `followUpNote` when `followUpRequired=true`; passes valid payload | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **UNIT-03** | Unit | BR-10, FR-11 | Ticket status transition matrix logic | Validates permitted transitions; rejects invalid jumps (e.g. `NEW` $\rightarrow$ `CLOSED`) with `400` | `server/tests/lab-03/statusMatrix.test.ts` | **PASS** |
| **API-01** | API | AC-01, FR-01, BR-02 | Create Action Taken `POST /api/tickets/:id/actions` | Creates action line with Date/Time, Description, Result, Performer; returns `201 Created` | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-02** | API | AC-02, BR-03 | Create Action Taken missing conditional follow-up note | Returns `400 Bad Request` with detail highlighting missing `followUpNote` | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-03** | API | AC-03, FR-10, BR-09 | Create Action Taken with `claimTicket: true` on unassigned ticket | Creates action and updates ticket `ownerId` to authenticated user | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-04** | API | AC-04, FR-03, BR-05 | Update Action Taken `PATCH /api/tickets/:id/actions/:actionId` | IT Staff updates description, result, follow-up note; returns `200 OK` | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-05** | API | AC-06, FR-05, BR-06 | Requester views Actions Taken on owned ticket `GET /api/tickets/:id/actions` | Returns `200 OK` with list of actions taken by IT staff on owned ticket | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-06** | API | AC-07, FR-06..07 | Requester mutation and unowned ticket action restriction | Requester calling `POST`/`PATCH` or requesting unowned ticket actions receives `403 Forbidden` | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-07** | API | AC-08, BR-08 | Action performer autonomy & ticket owner preservation | Non-owner staff logs action; performer is recorded without altering ticket `ownerId` | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **API-08** | API | AC-09, BR-11, FR-11 | Resolution Gate rejection on missing Actions Taken | Status transition to `RESOLVED` on ticket with 0 actions returns `422` (`MISSING_ACTION_TAKEN`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| **API-09** | API | AC-10, BR-12, FR-12 | Resolution Gate rejection on missing resolution summary | Status transition to `RESOLVED` missing summary returns `422` (`MISSING_RESOLUTION_SUMMARY`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| **API-10** | API | AC-11, BR-10, BR-14 | Successful Resolution Gate passage & status update | When actions $\ge 1$ and summary provided, status updates to `RESOLVED`, stamps `resolvedAt`, returns `200` | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| **API-11** | API | AC-12, FR-14..15 | Staff Dashboard Metrics & Recent Tickets `GET /api/dashboard/staff` | Returns 7 KPI counts including "Owned by Me" and recent 10 tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| **API-12** | API | AC-14, FR-17..18 | Requester Dashboard `GET /api/dashboard/requester` | Returns active tickets, waiting for my input count, and recent activity scoped to user | `server/tests/lab-04/requester-dashboard.api.test.ts` | **PASS** |
| **CONC-01** | Concurrency | AC-05, BR-16, FR-20 | Optimistic concurrency control on ticket & action updates | Stale `expectedUpdatedAt` payload triggers `409 Conflict` (code `STALE_UPDATE`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| **PERF-01** | Perf Smoke | FR-14, FR-17 | Dashboard metrics query latency smoke test | Metrics aggregation queries execute in under 200ms on simulated database | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| **MIGR-01** | Migration | BR-23, FR-22 | Prisma schema migration & reversible rollback verification | Verifies additive migration creates `actions_taken` and down-migration cleanly reverts | `server/tests/lab-04/migration.test.ts` | **PASS** |
| **UI-01** | UI Comp | AC-12, AC-13, FR-14 | Staff Dashboard KPI cards, "Owned by Me" & Recent Tickets | Renders 7 metric cards, Recent Tickets table, and verifies drill-down navigation links | `client/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| **UI-02** | UI Comp | AC-14, AC-15, FR-17 | Requester Dashboard cards & Action Required alert banner | Renders Active Tickets, Waiting for My Input banner, and verifies drill-down navigation | `client/tests/lab-04/RequesterDashboard.test.tsx` | **PASS** |
| **UI-03** | UI Comp | AC-01..04, FR-01..03 | Actions Taken feed rendering, Create & Edit modal | Chronological timeline, action badges, follow-up flags, opens create/edit modal | `client/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| **UI-04** | UI Comp | AC-06, FR-05 | Requester read-only Actions Taken view | Renders action feed on Requester Detail screen; hides all create/edit action controls | `client/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| **UI-05** | UI Comp | AC-09..11, FR-11..13 | Resolution Gate modal verification checklist | Displays real-time checks; disables submit when prerequisites missing; enables on full criteria | `client/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| **A11Y-01** | Style/A11y | AC-17 | Visible focus rings & responsive touch target verification | Programmatically asserts 2px outline with `#006B3C` and verified keyboard navigation | `e2e/capture-lab4-screenshots.spec.ts` | **PASS** |
| **RESP-01** | Responsive | AC-17 | Responsive layout adaptations across breakpoints | Desktop grid shifts to 2-column on tablet and 1-column cards on mobile (<768px); zero horizontal scroll | `e2e/capture-lab4-screenshots.spec.ts` | **PASS** |
| **E2E-01** | E2E | AC-12..15 | E2E Staff & Requester dashboard discovery and drill-down | Staff & Requester log in $\rightarrow$ view dashboards $\rightarrow$ click metric cards $\rightarrow$ verify filtered queues | `e2e/lab-04/dashboards.spec.ts` | **PASS** |
| **E2E-02** | E2E | AC-01..07 | E2E Actions Taken lifecycle (Staff create/edit & Requester read) | Staff logs action $\rightarrow$ updates action $\rightarrow$ Requester views action read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | **PASS** |
| **E2E-03** | E2E | AC-09..11 | E2E Resolution Gate enforcement & resolution workflow | Staff attempts premature resolve (blocked) $\rightarrow$ logs action $\rightarrow$ adds summary $\rightarrow$ resolves | `e2e/lab-04/ticket-resolution.spec.ts` | **PASS** |
| **UI-06** | UI Int | AC-05, BR-16 | Concurrency stale update collision feedback | OCC rejects stale update with `409 Conflict` (code `STALE_UPDATE`) and renders alert | `client/tests/lab-04/TicketWorkflow.test.tsx`<br>`server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |

---

## 3. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion defined in `docs/lab-04/specification.md` is 100% traceably verified with passing automated test evidence:

| AC ID | Acceptance Criterion Summary | Automated Test File(s) | Test ID(s) | Verification Evidence |
|---|---|---|---|---|
| **AC-01** | IT Staff logs valid Action Taken with all required fields | `server/tests/lab-04/actions-taken.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-taken-flow.spec.ts` | `API-01`<br>`UI-03`<br>`E2E-02` | `POST /api/tickets/:id/actions` returns `201 Created` with full action object and audits performer. |
| **AC-02** | Action Taken missing conditional follow-up note rejected (`400`) | `server/tests/lab-04/actions-taken.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx` | `UNIT-02`<br>`API-02`<br>`UI-03` | Validates error response with detail `Follow-up note is required when follow-up is requested`. |
| **AC-03** | Log Action Taken with `claimTicket: true` assigns ownership | `server/tests/lab-04/actions-taken.api.test.ts`<br>`e2e/lab-04/actions-taken-flow.spec.ts` | `API-03`<br>`E2E-02` | Ticket `ownerId` updates atomically to authenticated staff performer on unassigned tickets. |
| **AC-04** | IT Staff updates existing Action Taken (`PATCH`) | `server/tests/lab-04/actions-taken.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-taken-flow.spec.ts` | `API-04`<br>`UI-03`<br>`E2E-02` | `PATCH /api/tickets/:id/actions/:actionId` updates fields while preserving initial `performedById`. |
| **AC-05** | Optimistic concurrency control rejects stale update (`409 Conflict`) | `server/tests/lab-04/ticket-workflow.api.test.ts`<br>`client/tests/lab-04/TicketWorkflow.test.tsx` | `CONC-01`<br>`UI-06` | Atomic `updateMany` returns `409 Conflict` (code `STALE_UPDATE`) when `expectedUpdatedAt` is stale. |
| **AC-06** | Requester views Actions Taken on owned ticket in read-only mode | `server/tests/lab-04/actions-taken.api.test.ts`<br>`client/tests/lab-04/ActionsTaken.test.tsx`<br>`e2e/lab-04/actions-taken-flow.spec.ts` | `API-05`<br>`UI-04`<br>`E2E-02` | Requester sees complete chronological action timeline; create/edit buttons are absent from DOM. |
| **AC-07** | Requester blocked from action mutations and unowned tickets (`403`) | `server/tests/lab-04/actions-taken.api.test.ts` | `API-06` | Ownership guard rejects access to foreign tickets with `403 Forbidden` without exposing metadata. |
| **AC-08** | Action performer autonomy & ticket owner preservation | `server/tests/lab-04/actions-taken.api.test.ts`<br>`e2e/lab-04/actions-taken-flow.spec.ts` | `API-07`<br>`E2E-02` | Secondary staff member records action on another's ticket without changing ticket's assigned owner. |
| **AC-09** | Resolution Gate blocks resolution when zero Actions Taken exist (`422`) | `server/tests/lab-04/ticket-workflow.api.test.ts`<br>`client/tests/lab-04/TicketWorkflow.test.tsx`<br>`e2e/lab-04/ticket-resolution.spec.ts` | `API-08`<br>`UI-05`<br>`E2E-03` | Status transition rejects with `422` containing `code: MISSING_ACTION_TAKEN`. |
| **AC-10** | Resolution Gate blocks resolution when resolution summary missing (`422`) | `server/tests/lab-04/ticket-workflow.api.test.ts`<br>`client/tests/lab-04/TicketWorkflow.test.tsx`<br>`e2e/lab-04/ticket-resolution.spec.ts` | `API-09`<br>`UI-05`<br>`E2E-03` | Status transition rejects with `422` containing `code: MISSING_RESOLUTION_SUMMARY`. |
| **AC-11** | Successful resolution when all Resolution Gate criteria are met | `server/tests/lab-04/ticket-workflow.api.test.ts`<br>`client/tests/lab-04/TicketWorkflow.test.tsx`<br>`e2e/lab-04/ticket-resolution.spec.ts` | `UNIT-03`<br>`API-10`<br>`UI-05`<br>`E2E-03` | Transitions to `RESOLVED`, stamps `resolvedAt`, stores resolution summary, returns `200 OK`. |
| **AC-12** | Staff Dashboard renders 7 KPI metric cards, "Owned by Me" & Recent Tickets | `server/tests/lab-04/staff-dashboard.api.test.ts`<br>`client/tests/lab-04/StaffDashboard.test.tsx`<br>`e2e/lab-04/dashboards.spec.ts` | `API-11`<br>`UI-01`<br>`E2E-01` | Displays 7 metric cards, workload numbers, average resolution time, and recent tickets table. |
| **AC-13** | Staff Dashboard metric card click drills down to pre-filtered queue | `client/tests/lab-04/StaffDashboard.test.tsx`<br>`e2e/lab-04/dashboards.spec.ts` | `UI-01`<br>`E2E-01` | Card clicks route to Ticket Queue tab with pre-applied status/ownership filters. |
| **AC-14** | Requester Dashboard renders Active Tickets, Waiting Input & Recent Activity | `server/tests/lab-04/requester-dashboard.api.test.ts`<br>`client/tests/lab-04/RequesterDashboard.test.tsx`<br>`e2e/lab-04/dashboards.spec.ts` | `API-12`<br>`UI-02`<br>`E2E-01` | Scoped to authenticated requester: displays Active Tickets, Waiting on Input, and Resolved metrics. |
| **AC-15** | Requester Dashboard metric card click drills down to `/tickets` | `client/tests/lab-04/RequesterDashboard.test.tsx`<br>`e2e/lab-04/dashboards.spec.ts` | `UI-02`<br>`E2E-01` | Card clicks route to `/tickets` preserving `?status=...&resolvedRange=...` URL parameters. |
| **AC-16** | Safe zero division when zero tickets are resolved in reporting window | `server/tests/lab-04/staff-dashboard.api.test.ts` | `UNIT-01`<br>`API-11` | Returns `avgResolutionTimeHours: 0` and formatted string `"0m"` without throwing `NaN` or `Infinity`. |
| **AC-17** | Fluid responsive layout adaptation on Desktop, Tablet, and Mobile | `e2e/capture-lab4-screenshots.spec.ts`<br>`client/tests/lab-03/Responsive.test.tsx` | `RESP-01`<br>`A11Y-01` | Zero horizontal scroll ($w \le 100\text{vw}$) programmatically verified on 1280px, 820px, and 375px. |
| **AC-18** | Backward compatibility invariance and clean database rollback | `server/tests/lab-04/migration.test.ts` | `MIGR-01`<br>`PERF-01` | Additive schema applies cleanly; reversible down-migration script drops columns and tables safely. |

---

## 4. Responsive and Visual Inspection Checklist

| Checkpoint | Target Viewport | Screen / Component | Acceptance Expectation | Inspection Result |
|---|---|---|---|---|
| **CHK-01** | Desktop ($\ge 992\text{px}$) | `/staff/dashboard` | 7 KPI metric cards render in clean grid; Recent Tickets table displays all columns. | **PASS** (Zero overflow, all columns visible) |
| **CHK-02** | Desktop ($\ge 992\text{px}$) | `/dashboard` | 5 Requester metric cards render side-by-side with Action Required alert banner. | **PASS** (Banner renders with amber accent) |
| **CHK-03** | Tablet ($768\text{px}-991\text{px}$) | `/staff/dashboard` & `/dashboard` | Metric cards adapt to 2-column layout; Recent Tickets table compresses padding. | **PASS** (No horizontal scroll, fluid adaptation) |
| **CHK-04** | Mobile ($< 768\text{px}$) | Both Dashboards | Metric cards stack into 1 full-width column; figures scale cleanly without truncation. | **PASS** (Single column vertical stack, $w \le 100\text{vw}$) |
| **CHK-05** | Mobile ($< 768\text{px}$) | Actions Taken Feed | Action cards wrap content; timestamps, results, and badges align without overflow. | **PASS** (Clean vertical flex layout, no horizontal scroll) |
| **CHK-06** | All Viewports | Metric Cards & Actions | Visible `2px solid #006B3C` focus ring on keyboard tab; card elevates on hover. | **PASS** (Focus ring verified in `04-staff-dashboard-focus-ring.png`) |
| **CHK-07** | All Viewports | Resolution Gate Modal | Checklist displays green checkmarks for satisfied items and red warnings for missing items. | **PASS** (Verified in `06-resolution-gate-checklist-blocked.png` & `07-satisfied.png`) |
| **CHK-08** | All Viewports | Global | Zero horizontal scrolling ($w \le 100\text{vw}$) across all viewports. | **PASS** (Programmatically asserted: `scrollWidth <= clientWidth`) |

---

## 5. Actual Test Execution Summary

### 5.1 Test Suite Summary
- **Backend Test Suite (Server Vitest):**
  - Command: `npm --prefix server test`
  - Results: **23 test files passed, 191/191 tests passed (12.2s)**
  - Coverage: Schema evolution, seed diversity, migration rollback, actions taken CRUD & OCC, ticket workflow & resolution gate diagnostics, staff dashboard metrics, requester dashboard metrics, authentication RBAC.
- **Frontend Test Suite (Client Vitest):**
  - Command: `npm --prefix client test -- --run`
  - Results: **18 test files passed, 126/126 tests passed (14.4s)**
  - Coverage: ActionsTaken feed and modals, TicketWorkflow controls & Resolution Gate checklists, StaffDashboard KPI metrics & drill-downs, RequesterDashboard metrics & alert banner, Login & mandatory password change, user administration.
- **E2E Integration Suites (Playwright):**
  - Command: `npx playwright test e2e/lab-04 --workers=1`
  - Results: **4 passed (14.0s)**
  - Coverage:
    - `actions-taken-flow.spec.ts`: Staff logs action, validates conditional follow-up note, claims unassigned ticket, edits action, requester views read-only.
    - `dashboards.spec.ts`: Requester dashboard metrics, action required alert, drill-downs to My Tickets; Staff dashboard 7 KPI cards, queue drill-downs.
    - `ticket-resolution.spec.ts`: Full lifecycle from creation $\rightarrow$ in-progress $\rightarrow$ requester problem resolved advisory $\rightarrow$ staff resolution gate enforcement $\rightarrow$ resolution $\rightarrow$ closure.
- **Responsive & Visual Inspection Suite (Playwright):**
  - Command: `npx playwright test e2e/capture-lab4-screenshots.spec.ts --workers=1`
  - Results: **3 passed (14.6s)**
  - Artifacts Generated: **19 high-resolution PNG screenshots** across all viewports (Desktop, Tablet, Mobile) stored in `artifacts/lab-04/screenshots/`:
    - **Staff Dashboard (`staff-dashboard/`):**
      - `01-staff-dashboard-desktop.png`: Full desktop grid (7 KPI metrics, workload, recent tickets).
      - `02-staff-dashboard-tablet.png`: 2-column tablet layout.
      - `03-staff-dashboard-mobile.png`: 1-column vertical mobile stack.
      - `04-staff-dashboard-focus-ring.png`: Accessible `2px solid #006B3C` focus ring on keyboard tab.
      - `05-staff-dashboard-drilldown-queue.png`: Pre-filtered ticket queue on KPI card click.
    - **Requester Dashboard (`requester-dashboard/`):**
      - `01-requester-dashboard-desktop.png`: 5 metric cards and recent activity.
      - `02-requester-dashboard-tablet.png`: 2-column tablet layout.
      - `03-requester-dashboard-mobile.png`: 1-column mobile stack.
      - `04-requester-dashboard-action-required-banner.png`: Amber Action Required alert banner.
      - `05-requester-dashboard-drilldown-mytickets.png`: Filtered `/tickets` queue on card drill-down.
    - **Actions Taken & Resolution Gate (`actions-taken/`):**
      - `01-actions-feed-staff-desktop.png`: Full action timeline feed on desktop.
      - `01b-actions-feed-staff-tablet.png`: Action timeline feed on tablet (768px-991px).
      - `01c-actions-feed-staff-mobile.png`: Action timeline feed on mobile (<768px).
      - `02-actions-feed-requester-readonly.png`: Requester view with hidden mutation controls.
      - `03-log-action-modal-empty.png`: Initial empty action modal.
      - `04-log-action-modal-followup-validation.png`: Conditional follow-up note validation.
      - `05-log-action-modal-populated.png`: Populated action logging form.
      - `06-resolution-gate-checklist-blocked.png`: Resolution modal checklist with missing criteria.
      - `07-resolution-gate-checklist-satisfied.png`: Resolution modal checklist with all criteria satisfied.
- **System Regression Verification:**
  - Server Unit & API regression across Labs 1 through 4: **191/191 tests passing**.
  - Client Component regression across Labs 1 through 4: **126/126 tests passing**.
  - Lab 3 End-to-End regression suite: `npx playwright test e2e/lab-03 --workers=1` (**3/3 passed, 7.9s**), confirming user administration, RBAC, and responsive layout foundations.
  - Total automated unit/API/component tests: **317 tests passing with 0 failures** + **7 E2E/inspection specs passing**.
