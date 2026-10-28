# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy

This test plan follows a **Test-Driven Documentation (Test DD)** methodology, defining comprehensive test specifications, boundary conditions, authorization rules, and end-to-end user journeys derived directly from the Sprint 4 engineering contract before code implementation begins. When development begins, implementation will proceed according to strict **Test-Driven Development (TDD)**: writing failing automated test suites first, writing minimal production code to satisfy assertions, and refactoring while maintaining 100% test pass rates across all suites.

The Lab 4 test suite spans eight specialized testing levels:
1. **Unit Testing:** Validates pure business logic in isolation, including KPI metric aggregation formulas (average resolution time, safe zero division), Resolution Gate predicate evaluations, hierarchy cycle detection algorithms, and time/duration formatting utilities.
2. **API & Security Integration:** Verifies REST endpoint contracts, role-based authorization (`401`/`403`), request payload validation, HTTP `422` error structures for Resolution Gate failures, and conflict handling (`409`).
3. **UI Component Testing:** Verifies React component rendering, state transitions, modal dialog behaviors, field validation, and checklist states for Dashboard Metric Cards, Actions Taken feed, Parent-Child panels, and Resolution Gate confirmation modals.
4. **UI Style & Design Tokens:** Verifies strict adherence to Zen Green design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`), metric border accents, status badges, action type tags, and focus ring styling.
5. **Responsive Testing:** Verifies responsive layout transformations across Desktop ($\ge 992\text{px}$), Tablet ($768\text{px}-991\text{px}$), and Mobile ($< 768\text{px}$) viewports with zero horizontal scrolling.
6. **Migration & Regression Testing:** Verifies zero regression for Lab 1, Lab 2, and Lab 3 features (authentication, ticket creation, attachment lifecycle, comments, notes, and user administration).
7. **Security Probing:** Validates that Requesters cannot access staff dashboards, log Actions Taken, or bypass the Resolution Gate.
8. **End-to-End (E2E) Testing:** Validates full multi-role browser journeys using Playwright, covering operational dashboard discovery with drill-down, collaborative parent-child ticket management, and multi-staff action logging leading to successful gated resolution.

---

## 2. Planned Tests

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Initial Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-21, BR-22, FR-21 | Dashboard KPI calculation & zero-division safeguard | Calculates average resolution time in minutes correctly; returns `0` when zero tickets resolved | `server/tests/lab-04/dashboardMetrics.test.ts` | Planned |
| **UNIT-02** | Unit | BR-11..13, FR-14..16 | Resolution Gate validation predicate function | Returns valid when actions $\ge 1$, summary $\ge 10$ chars, and children resolved; returns specific failure flags otherwise | `server/tests/lab-04/resolutionGate.test.ts` | Planned |
| **UNIT-03** | Unit | BR-01, BR-02, FR-11 | Parent-child hierarchy validation & cycle detection | Permits 1-tier child linking; rejects self-link, child-as-parent, and parent-as-child | `server/tests/lab-04/hierarchyValidator.test.ts` | Planned |
| **UNIT-04** | Unit | BR-08, FR-01 | Action Taken payload validation schema | Validates actionType enum, summary length (3-150), details length (10-2000), timeSpent ($\ge 0$) | `server/tests/lab-04/actionValidation.test.ts` | Planned |
| **UNIT-05** | Unit | BR-22, FR-18 | Duration formatting utility (minutes to hours/minutes) | Formats `45` $\rightarrow$ `"45m"`, `225` $\rightarrow$ `"3h 45m"`, `0` $\rightarrow$ `"0m"` | `client/tests/lab-04/formatDuration.test.ts` | Planned |
| **API-01** | API | AC-01, FR-01, BR-05 | Log Action Taken `POST /api/tickets/:id/actions` | Creates action record with authenticated user as `performer`; returns `201 Created` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-02** | API | AC-02, BR-05, BR-06 | Ownership preservation on action by non-owner | Non-owner staff logs action; action performer is recorded without changing ticket `ownerId` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-03** | API | AC-03, FR-06 | Log Action Taken with `claimTicket: true` on unassigned ticket | Creates action and updates ticket `ownerId` to authenticated user | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-04** | API | AC-04, BR-09, FR-22 | Requester access restriction on Actions Taken APIs | Requester calling `GET` or `POST` `/api/tickets/:id/actions` receives `403 Forbidden` | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-05** | API | AC-05, FR-03 | Retrieve Actions Taken `GET /api/tickets/:id/actions` | Returns actions list in chronological order with performer details and total time spent | `server/tests/lab-04/actions.api.test.ts` | Planned |
| **API-06** | API | AC-06, FR-07 | Link Child Ticket `POST /api/tickets/:id/children` | Links child ticket; updates child `parentId`; returns `200 OK` | `server/tests/lab-04/hierarchy.api.test.ts` | Planned |
| **API-07** | API | AC-07, BR-01, BR-02 | Link Child Ticket hierarchy rules & cycle rejection | Rejects self-link (`400`) and linking tickets that are already parent/child (`409 Conflict`) | `server/tests/lab-04/hierarchy.api.test.ts` | Planned |
| **API-08** | API | AC-09, BR-03, FR-10 | Unlink Child Ticket `DELETE /api/tickets/:id/children/:childId` | Clears `parentId` on child ticket; returns `200 OK` | `server/tests/lab-04/hierarchy.api.test.ts` | Planned |
| **API-09** | API | AC-10..12, BR-11..14 | Resolution Gate rejection on missing prerequisites | Status update to `RESOLVED` fails with `422 Unprocessable Entity` detailing missing actions, summary, or open children | `server/tests/lab-04/resolution-gate.api.test.ts` | Planned |
| **API-10** | API | AC-13, BR-10, BR-15 | Successful Resolution Gate passage & status update | When all criteria met, status updates to `RESOLVED`, sets `resolvedAt`, returns `200 OK` | `server/tests/lab-04/resolution-gate.api.test.ts` | Planned |
| **API-11** | API | AC-14, AC-16, FR-18 | Dashboard Metrics `GET /api/dashboard/metrics` | Returns accurate open, unassigned, waiting, urgent counts and safe average resolution | `server/tests/lab-04/dashboard.api.test.ts` | Planned |
| **API-12** | API | AC-14, FR-19 | Dashboard Queue Breakdown `GET /api/dashboard/breakdown` | Returns ticket distributions grouped by status, priority, and category | `server/tests/lab-04/dashboard.api.test.ts` | Planned |
| **UI-01** | UI Comp | AC-14, FR-18 | Dashboard KPI metric cards rendering | Displays 6 metric cards with correct values, left border accents, labels, and hover states | `client/tests/lab-04/DashboardMetrics.test.tsx` | Planned |
| **UI-02** | UI Comp | AC-15, BR-23, FR-20 | Dashboard metric card drill-down navigation | Clicking metric card navigates to `/staff/tickets` with matching URL query parameters | `client/tests/lab-04/DashboardMetrics.test.tsx` | Planned |
| **UI-03** | UI Comp | AC-01, AC-05, FR-03 | Actions Taken feed rendering & Log Action modal | Renders chronological feed, action type badges; opens modal; validates input fields | `client/tests/lab-04/ActionsTakenFeed.test.tsx` | Planned |
| **UI-04** | UI Comp | AC-06, AC-08, FR-08 | Parent-Child ticket widget & child ticket banner | Renders child tickets list on parent; displays parent callout banner on child ticket | `client/tests/lab-04/ParentChildWidget.test.tsx` | Planned |
| **UI-05** | UI Comp | AC-10..13, FR-13 | Resolution Gate modal verification checklist | Displays real-time checks; disables submit when prerequisites missing; enables on full criteria | `client/tests/lab-04/ResolutionGateModal.test.tsx` | Planned |
| **RESP-01** | Responsive | AC-17 | Dashboard responsive layout adaptation | 6-card grid on desktop ($\ge 992\text{px}$) shifts to 2-column on tablet and 1-column on mobile ($< 768\text{px}$) | `client/tests/lab-04/DashboardResponsive.test.tsx` | Planned |
| **RESP-02** | Responsive | AC-17 | Ticket Detail Actions feed & Child table mobile shift | Timeline and child tickets table convert to stacked responsive cards on mobile viewport | `client/tests/lab-04/DetailResponsive.test.tsx` | Planned |
| **E2E-01** | E2E | AC-14, AC-15, FR-20 | E2E Dashboard inspection & drill-down to queue | Staff logs in $\rightarrow$ views dashboard KPI cards $\rightarrow$ clicks "Unassigned" $\rightarrow$ verifies queue filtered | `e2e/lab-04/dashboard-drilldown.spec.ts` | Planned |
| **E2E-02** | E2E | AC-06..09, AC-12 | E2E Parent-Child ticket workflow & resolution blocking | Staff creates parent-child link $\rightarrow$ verifies child banner $\rightarrow$ tries resolving parent (blocked) $\rightarrow$ resolves child $\rightarrow$ unblocks | `e2e/lab-04/parent-child-workflow.spec.ts` | Planned |
| **E2E-03** | E2E | AC-01..03, AC-10..13 | E2E Multi-staff Actions Taken & gated ticket resolution | Staff A claims ticket $\rightarrow$ Staff B logs action $\rightarrow$ Staff A logs action $\rightarrow$ triggers resolution modal $\rightarrow$ provides summary $\rightarrow$ resolves | `e2e/lab-04/actions-and-resolution-gate.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion defined in `docs/lab-04/specification.md` is 100% traceably mapped to planned automated test suites across multiple test levels:

| AC ID | Acceptance Criterion Summary | Planned Automated Test File(s) | Planned Test ID(s) |
|---|---|---|---|
| **AC-01** | IT Staff logs valid Action Taken (`POST /api/tickets/:id/actions`) | `server/tests/lab-04/actions.api.test.ts`<br>`client/tests/lab-04/ActionsTakenFeed.test.tsx`<br>`e2e/lab-04/actions-and-resolution-gate.spec.ts` | `API-01`<br>`UI-03`<br>`E2E-03` |
| **AC-02** | Ownership preservation when non-owner staff logs action | `server/tests/lab-04/actions.api.test.ts`<br>`e2e/lab-04/actions-and-resolution-gate.spec.ts` | `API-02`<br>`E2E-03` |
| **AC-03** | Log Action Taken with `claimTicket: true` on unassigned ticket | `server/tests/lab-04/actions.api.test.ts`<br>`e2e/lab-04/actions-and-resolution-gate.spec.ts` | `API-03`<br>`E2E-03` |
| **AC-04** | Requester calling Actions Taken endpoints receives `403 Forbidden` | `server/tests/lab-04/actions.api.test.ts` | `API-04` |
| **AC-05** | Chronological Actions Taken feed rendering with badges and duration | `server/tests/lab-04/actions.api.test.ts`<br>`client/tests/lab-04/ActionsTakenFeed.test.tsx` | `API-05`<br>`UI-03` |
| **AC-06** | Link existing open ticket as child to parent ticket | `server/tests/lab-04/hierarchy.api.test.ts`<br>`client/tests/lab-04/ParentChildWidget.test.tsx`<br>`e2e/lab-04/parent-child-workflow.spec.ts` | `API-06`<br>`UI-04`<br>`E2E-02` |
| **AC-07** | Rejection of circular linking and multi-tier hierarchy | `server/tests/lab-04/hierarchyValidator.test.ts`<br>`server/tests/lab-04/hierarchy.api.test.ts` | `UNIT-03`<br>`API-07` |
| **AC-08** | Prominent parent ticket banner displayed on child ticket | `client/tests/lab-04/ParentChildWidget.test.tsx`<br>`e2e/lab-04/parent-child-workflow.spec.ts` | `UI-04`<br>`E2E-02` |
| **AC-09** | Unlinking child ticket clears parent reference without side effects | `server/tests/lab-04/hierarchy.api.test.ts` | `API-08` |
| **AC-10** | Resolution Gate blocks resolution when zero Actions Taken exist (`422`) | `server/tests/lab-04/resolutionGate.test.ts`<br>`server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGateModal.test.tsx` | `UNIT-02`<br>`API-09`<br>`UI-05` |
| **AC-11** | Resolution Gate blocks resolution when resolution summary is missing | `server/tests/lab-04/resolutionGate.test.ts`<br>`server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGateModal.test.tsx` | `UNIT-02`<br>`API-09`<br>`UI-05` |
| **AC-12** | Resolution Gate blocks parent resolution when child tickets are active | `server/tests/lab-04/resolutionGate.test.ts`<br>`server/tests/lab-04/resolution-gate.api.test.ts`<br>`e2e/lab-04/parent-child-workflow.spec.ts` | `UNIT-02`<br>`API-09`<br>`E2E-02` |
| **AC-13** | Successful resolution when all Resolution Gate criteria are met | `server/tests/lab-04/resolutionGate.test.ts`<br>`server/tests/lab-04/resolution-gate.api.test.ts`<br>`client/tests/lab-04/ResolutionGateModal.test.tsx`<br>`e2e/lab-04/actions-and-resolution-gate.spec.ts` | `UNIT-02`<br>`API-10`<br>`UI-05`<br>`E2E-03` |
| **AC-14** | Operational Dashboard renders 6 KPI metric cards and breakdowns | `server/tests/lab-04/dashboardMetrics.test.ts`<br>`server/tests/lab-04/dashboard.api.test.ts`<br>`client/tests/lab-04/DashboardMetrics.test.tsx`<br>`e2e/lab-04/dashboard-drilldown.spec.ts` | `UNIT-01`<br>`API-11`<br>`API-12`<br>`UI-01`<br>`E2E-01` |
| **AC-15** | Dashboard metric card click drills down to pre-filtered queue | `client/tests/lab-04/DashboardMetrics.test.tsx`<br>`e2e/lab-04/dashboard-drilldown.spec.ts` | `UI-02`<br>`E2E-01` |
| **AC-16** | Safe zero division when zero tickets are resolved in reporting window | `server/tests/lab-04/dashboardMetrics.test.ts`<br>`server/tests/lab-04/dashboard.api.test.ts` | `UNIT-01`<br>`API-11` |
| **AC-17** | Fluid responsive layout adaptation on Desktop, Tablet, and Mobile | `client/tests/lab-04/DashboardResponsive.test.tsx`<br>`client/tests/lab-04/DetailResponsive.test.tsx` | `RESP-01`<br>`RESP-02` |
| **AC-18** | Backward compatibility and regression invariance for Labs 1, 2, and 3 | Existing test suites (`npm run test:server`, `npm run test:client`, `npm run test:e2e`) | Regression Suite |

---

## 4. Responsive and Visual Inspection Checklist

| Checkpoint | Target Viewport | Screen / Component | Acceptance Expectation |
|---|---|---|---|
| **CHK-01** | Desktop ($\ge 992\text{px}$) | `/staff/dashboard` | 6 KPI metric cards render in clean grid; distribution widgets render side-by-side. |
| **CHK-02** | Tablet ($768\text{px}-991\text{px}$) | `/staff/dashboard` | Metric cards adapt to 2-column layout; distribution widgets stack cleanly. |
| **CHK-03** | Mobile ($< 768\text{px}$) | `/staff/dashboard` | Metric cards stack into 1 full-width column; text and figures scale without clipping. |
| **CHK-04** | Mobile ($< 768\text{px}$) | `/staff/tickets/:id` (Actions Feed) | Action cards wrap content; timestamps and badges align without horizontal overflow. |
| **CHK-05** | Mobile ($< 768\text{px}$) | `/staff/tickets/:id` (Child Tickets) | Child tickets table transforms into full-width stacked cards. |
| **CHK-06** | All Viewports | `/staff/dashboard` Metric Cards | Visible `2px solid #006B3C` focus ring on keyboard tab; card elevates on hover. |
| **CHK-07** | All Viewports | Resolution Gate Modal | Checklist displays green checkmarks for passed items and red warnings for failed items. |
| **CHK-08** | All Viewports | Global | Zero horizontal scrolling ($w \le 100\text{vw}$) across all viewports. |
