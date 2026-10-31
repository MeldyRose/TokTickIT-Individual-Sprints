# Lab 4 — Peer Review Record

**Author:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: [@MeldyRose](https://github.com/MeldyRose)  
**Peer reviewer:** Phattaratorn Mahatkeerati — 67070503433 — GitHub: [@GGital](https://github.com/GGital)  

---

## 1. Pull Requests I Authored (Reviewed by My Partner @GGital)

| PR | Branch | Reviewer Verdict |
|:---:|---|---|
| [63](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/63) | `feature/22-lab-4-specification` | `Changes Requested → Approved` |
| [64](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/64) | `feature/23-database-schema-evolution` | `Approved` |
| [65](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/65) | `feature/24-actions-taken-api` | `Changes Requested → Approved` |
| [66](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/66) | `feature/25-ticket-workflow-resolution-gate` | `Changes Requested → Changes Requested → Approved` |
| [67](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/67) | `feature/26-actions-taken-ui` | `Changes Requested → Approved` |
| [68](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/68) | `feature/27-ticket-workflow-ui` | `Changes Requested → Approved` |
| [69](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/69) | `feature/28-dashboard-api` | `Changes Requested → Approved` |
| [70](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/70) | `feature/29-staff-dashboard-ui` | `Approved` |
| [71](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/71) | `feature/30-requester-dashboard-ui` | `Changes Requested → Approved` |
| [72](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/72) | `feature/31-e2e-inspection-docs` | `Pending Review` (Under Review) |

---

## 2. Detailed Review Discussions on My Pull Requests

### [PR #63](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/63) — `feature/22-lab-4-specification`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Requested alignment with the Lab 4 handout requirements:
  1. Specify all mandatory Action Taken fields: Performer, Date/Time, Description, Result, and conditional Follow-up note.
  2. Support editable Actions Taken (via `PATCH`) rather than only append-only creation.
  3. Include specifications for the Requester read-only view on Actions Taken and the dedicated Requester Dashboard.
  4. Document stale-update Optimistic Concurrency Control (OCC) and clean down-migration database rollback.
- **My Response (@MeldyRose):** Aligned `docs/lab-04/specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` with the handout: documented full Action Taken fields, `PATCH` endpoint contracts for editing, Requester read-only viewing, dedicated Requester Dashboard metrics, OCC timestamp comparison, and rollback script specifications.
- **Final Verdict:** `Approved`

### [PR #64](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/64) — `feature/23-database-schema-evolution`
- **Verdict:** `Approved`
- **Reviewer Comment (@GGital):** Verified Prisma schema evolution:
  - `ActionTaken` model created with foreign keys (`ticketId`, `performerId`), cascading deletion upon parent ticket deletion, and indexes on `ticketId`, `performerId`, and `actionDateTime`.
  - Additive ticket resolution columns (`resolvedAt`, `closedAt`, `resolutionSummary`) added without breaking existing records.
  - Reversible down-migration rollback script (`rollback.sql`) verified and tested in `migration.test.ts`.
  - Seed script populates diverse tickets with 0, 1, and multiple actions idempotently. Ready to merge!
- **My Response (@MeldyRose):** Merged into `lab4-staging`.

### [PR #65](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/65) — `feature/24-actions-taken-api`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review flagged three issues:
  1. The 1-second OCC tolerance window was too lenient and risked lost updates; OCC must enforce exact timestamp matching.
  2. Missing or invalid `expectedUpdatedAt` was bypassing the OCC check instead of being rejected.
  3. Potential race condition in `claimTicket: true` on unassigned tickets.
- **My Response (@MeldyRose):** Removed the 1s OCC tolerance to enforce exact timestamp equality, added strict validation rejecting missing or invalid `expectedUpdatedAt` with `400 Bad Request`, and wrapped action creation and ticket claiming in an atomic database transaction. Verified all 34 API tests pass cleanly.
- **Final Verdict:** `Approved`

### [PR #66](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/66) — `feature/25-ticket-workflow-resolution-gate`
- **Review Round 1:** `Changes Requested`
  - **Reviewer Comment (@GGital):**
    1. Transitioning a ticket to its identical current status should be rejected with `400 Bad Request` instead of a no-op 200.
    2. Move `rollback.sql` out of the test folder to `docs/lab-04/rollback.sql`.
  - **My Response (@MeldyRose):** Added same-status transition validation returning 400 Bad Request and relocated `rollback.sql`.
- **Review Round 2:** `Changes Requested`
  - **Reviewer Comment (@GGital):**
    1. Regression on Requester advisory resolution ("Problem Appears Resolved"): the endpoint call failed because `expectedUpdatedAt` was missing or not propagated properly.
  - **My Response (@MeldyRose):** Updated client `updateRequesterTicketStatus` to pass `expectedUpdatedAt` and properly parse structured error envelopes. Re-verified all status transitions and server test suites.
- **Final Verdict:** `Approved`

### [PR #67](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/67) — `feature/26-actions-taken-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Requested fixes on user experience and data binding:
  1. Support date/time editing in Action Taken modal rather than fixing it strictly to now.
  2. Ensure simultaneous ticket claiming triggers an immediate ticket detail refresh so the new owner is reflected.
  3. Verify performer attribution is retained when another staff member edits an action.
  4. Ensure read-only view for requesters hides all action creation/edit buttons.
- **My Response (@MeldyRose):** Updated `ActionTakenModal` with date picker support, wired state refresh on ticket claim, verified performer audit preservation, and confirmed requester read-only mode in component tests.
- **Final Verdict:** `Approved`

### [PR #68](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/68) — `feature/27-ticket-workflow-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review requested three UI workflow improvements:
  1. Add modal confirmation dialog for terminal `CANCELLED` status transitions.
  2. Closure remarks on `CLOSED` transition were inadvertently being posted as a public comment instead of being recorded in the ticket resolution/audit record.
  3. Implement live checklist in `StatusTransitionModal` displaying real-time feedback for Resolution Gate criteria (Actions Taken $\ge 1$ and Resolution Summary $\ge 10$ chars) and handle backend 422 diagnostic detail arrays.
- **My Response (@MeldyRose):** Addressed all items in commit `efa90c3`. Added confirmation modal for `CANCELLED`, fixed closure remarks so they are stored as internal resolution notes rather than public comments, and built the live reactive Resolution Gate checklist with `ConcurrencyConflictBanner`.
- **Final Verdict:** `Approved`

### [PR #69](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/69) — `feature/28-dashboard-api`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Flagged edge cases in dashboard calculation logic:
  1. Align `recentlyResolved` query filtering with BR-20 specifications (tickets resolved within the last 30 days).
  2. Flaky shared-DB tests in concurrent test runs due to unisolated test database mutations.
- **My Response (@MeldyRose):** Aligned `recentlyResolved` window with BR-20 criteria in `server/src/utils/dashboardUtils.ts` and improved test database isolation and teardown in `server/tests/lab-04/staff-dashboard.api.test.ts`. Confirmed sub-200ms query performance.
- **Final Verdict:** `Approved`

### [PR #70](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/70) — `feature/29-staff-dashboard-ui`
- **Verdict:** `Approved`
- **Reviewer Comment (@GGital):** Straight approval. Operations Dashboard renders 7 interactive KPI cards, tab focus rings (`2px solid #006B3C`), zero horizontal overflow across Desktop, Tablet, and Mobile, and 1-click drill-down navigation to pre-filtered Staff Ticket Queue. All component tests pass cleanly.
- **My Response (@MeldyRose):** Thanks for the quick review! Merged into `lab4-staging`.

### [PR #71](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/71) — `feature/30-requester-dashboard-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review caught filter lifecycle state persistence issues:
  1. Clicking metric cards to drill down into My Tickets should preserve query parameters (`/tickets?status=...&resolvedRange=...`) across browser back/forward and tab navigation.
  2. Location listener in `App.tsx` should use user references to avoid stale closure state during role changes.
- **My Response (@MeldyRose):** Addressed in commits `edc98fc`, `dd6b69f`, and `372bfc2`. Implemented bidirectional URL query parameter synchronization, updated location listeners using `userRef`, and verified all 33 component tests pass.
- **Final Verdict:** `Approved`

### [PR #72](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/72) — `feature/31-e2e-inspection-docs`
- **Current Verdict:** `Pending Review` (Under Review)
- **Reviewer Comment (@GGital):** Pending peer review verification of Playwright E2E suites, fresh-seed screenshot evidence, routing alignment, and finalized documentation.
- **My Response (@MeldyRose):** Addressed review comments; submitted for re-review.

---

## 3. Pull Requests I Reviewed for My Partner (@GGital)

### `feat/lab4-specification`
- **My Comment:** Reviewed partner's specification documentation. The contract thoroughly details the parent-child Actions Taken model, Resolution Gate workflow constraints (HTTP 422 diagnostic array), Optimistic Concurrency Control (HTTP 409 STALE_UPDATE), and dual Operations & Requester Dashboards. Acceptance Criteria (AC-01..18) are completely mapped in `tests.md`. Ready to merge into staging!  
- **Partner's Response:** Thanks for the review! Merging into lab4-staging now.

### `feat/lab4-database-schema-evolution`
- **My Comment:** Checked out the branch, inspected Prisma schema, and verified migrations and seed script.
  - `ActionTaken` model created with foreign keys (`ticketId`, `performerId`), indexes, and cascade delete on ticket removal.
  - `Ticket` model updated with additive resolution columns (`resolvedAt`, `closedAt`, `resolutionSummary`).
  - Down-migration rollback script (`rollback.sql`) verified and tested.
  - Seed script populates diverse tickets with 0, 1, and multiple actions idempotently.  
  Approved and good to merge!  
- **Partner's Response:** Thanks! Merged.

### `feat/lab4-actions-taken-api`
- **My Comment:** Approved! Checked backend Actions Taken API implementation:
  - `POST /api/tickets/:id/actions` validates mandatory description/result and enforces conditional `followUpNote` when `followUpRequired = true`.
  - `PATCH /api/tickets/:id/actions/:actionId` allows editing with OCC timestamp check.
  - Action performer is accurately recorded without mutating ticket owner, and `claimTicket: true` assigns ticket to performer on unassigned tickets.
  - Requester ownership scoping enforced (`403 Forbidden` for non-owners or mutation attempts).  
- **Partner's Response:** Thanks for verifying the role checks and claim logic.

### `feat/lab4-ticket-workflow-resolution-gate`
- **My Comment:** Approved!
  - Transition to `RESOLVED` enforces Resolution Gate: requires $\ge 1$ Action Taken and resolution summary $\ge 10$ characters, returning `422 Unprocessable Entity` with structured diagnostic array when criteria are unmet.
  - Atomic OCC enforcement via Prisma `updateMany` prevents race conditions and returns `409 Conflict` (code `STALE_UPDATE`) when `expectedUpdatedAt` does not match.
  - Role-based authorization checked prior to OCC.
  - Reopening tickets cleanly resets `resolvedAt` and `closedAt` to null.  
- **Partner's Response:** Verified atomic updateMany behavior and reopened ticket timestamp clearing.

### `feat/lab4-actions-taken-ui`
- **My Comment:** Approved!
  - Actions Taken feed renders chronologically with performer badges, follow-up alerts, and attachment notes.
  - Action Taken modal handles both creation and edit modes with inline validation feedback.
  - Requester detail view displays actions in read-only mode, completely hiding action creation and modification controls.
  - Component test suite passes 100%.  
- **Partner's Response:** Thanks! Merging now.

### `feat/lab4-ticket-workflow-ui`
- **My Comment:** Approved!
  - Status transition modals guide staff through resolution with real-time checklist validation.
  - Resolution Gate checklist dynamically checks off items as summary is entered ($\ge 10$ chars) and actions exist.
  - Concurrency conflict banner renders on `409 Conflict`, allowing user to discard changes or refresh.
  - Permitted status transition matrix correctly governs available buttons.  
- **Partner's Response:** Updated checklist with dynamic 422 diagnostic mapping.

### `feat/lab4-dashboard-api`
- **My Comment:** Approved!
  - `GET /api/dashboard/staff` computes all 7 KPI counts (Unassigned, My Assigned, In Progress, Waiting for Requester, High/Urgent, Total Open, Resolved Today) and average resolution time with safe zero division.
  - `GET /api/dashboard/requester` returns active tickets count, action required count, and recent 5 tickets scoped strictly to authenticated requester.
  - Queries execute in under 200ms.  
- **Partner's Response:** Confirmed zero-division safety and sub-200ms aggregations.

### `feat/lab4-staff-dashboard-ui`
- **My Comment:** Approved!
  - Operations Dashboard renders 7 interactive KPI metric cards in responsive CSS grid.
  - Keyboard navigation tab focus rings display distinct `2px solid #006B3C` Zen Green indicator.
  - Clicking any KPI metric card smoothly navigates to Staff Ticket Queue with pre-filtered parameters.
  - Recent tickets table provides quick access to operational tickets.  
- **Partner's Response:** Thanks for the review!

### `feat/lab4-requester-dashboard-ui`
- **My Comment:** Approved!
  - Requester Dashboard provides clear overview of personal support requests with 5 metric cards.
  - Amber alert banner highlights tickets in `WAITING_FOR_REQUESTER` status requiring requester feedback.
  - One-click navigation drills down into My Tickets with query filters preserved.
  - Fully responsive across desktop, tablet, and mobile viewports.  
- **Partner's Response:** Fixed filter lifecycle persistence and URL query state.

### `feat/lab4-e2e-inspection`
- **My Comment:** Approved!
  - All Playwright E2E test suites (`e2e/lab-04/`) pass 100%.
  - Screenshot evidence generated across desktop, tablet, and mobile breakpoints with verified zero horizontal scroll.
  - Full regression verification confirms 100% pass across all unit, integration, and E2E suites for Labs 1 through 4.
  - Ready for final release to `main`!  
- **Partner's Response:** Thanks! Merging now.
