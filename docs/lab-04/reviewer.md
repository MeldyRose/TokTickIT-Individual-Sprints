# Lab 4 — Peer Review Record

**Author:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: @MeldyRose
**Peer reviewer:** Phattaratorn Mahatkeerati — 67070503433 — GitHub: @GGital

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| 63 | feature/22-lab-4-specification | Approved: Verified all Lab 4 engineering contract specification documents under `docs/lab-04/` (`specification.md`, `tests.md`, `api-spec.md`, `ui-spec.md`, `ai-use.md`, `reviewer.md`). Specification comprehensively details the parent-child Actions Taken model, Resolution Gate verification rules (`HTTP 422`), Optimistic Concurrency Control (`HTTP 409`), dual Operations & Requester Dashboards, and full AC-01..18 traceability matrix. Zen Green design tokens adhered to. Approved for merge into `lab4-staging`! |
| 64 | feature/23-database-schema-evolution | Approved: Verified Prisma schema evolution for `ActionTaken` child model, cascading delete relation from `Ticket`, foreign key indexing (`ticketId`, `performerId`), and ticket resolution fields (`resolvedAt`, `closedAt`, `resolutionSummary`). Additive migration applied cleanly without data loss; down-migration rollback script verified in `migration.test.ts`. Seed script populates diverse tickets with 0, 1, and multiple Actions Taken idempotently. Approved! |
| 65 | feature/24-actions-taken-api | Changes Requested → Approved: Initial review identified a potential race condition in non-atomic OCC checks and recommended evaluating role-based authorization before checking OCC timestamps. Updated route handlers with atomic verification and role-first validation. Verified `POST /api/tickets/:id/actions`, `PATCH /api/tickets/:id/actions/:actionId`, `GET /api/tickets/:id/actions`, `claimTicket` simultaneous ownership assignment, and requester read-only ownership scoping (`403 Forbidden`). 34/34 API tests pass cleanly. Approved! |
| 66 | feature/25-ticket-workflow-resolution-gate | Changes Requested → Approved: Initial review noted that transitioning to the identical status must return `400 Bad Request`, and stale updates must use atomic `updateMany` with `{ id, updatedAt: expectedUpdatedAt }` returning `409 Conflict` (code `STALE_UPDATE`). Also verified Resolution Gate returns `422 Unprocessable Entity` with structured diagnostic array (`MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`), and timestamp resets (`resolvedAt = null`, `closedAt = null`) on reopen. Re-verified and approved! |
| 67 | feature/26-actions-taken-ui | Changes Requested → Approved: Initial review requested: 1) Support date editing in Action Taken modal; 2) Claim ticket page refresh and ticket state sync; 3) Accurate performer attribution; 4) Dynamic resolution summary display and live checklist for Resolution Gate with 422 diagnostic details. Implemented `ActionTakenModal` and `ActionsTakenSection` with Zen Green tokens and badges. All component unit tests pass. Approved! |
| 68 | feature/27-ticket-workflow-ui | Approved: Verified `TicketWorkflowControls` and `StatusTransitionModal`. Handles modal confirmations for `CANCELLED` and `CLOSED`, embeds Resolution Gate live verification checklist with dynamic validation on summary length ($\ge 10$ chars) and actions taken ($\ge 1$). Renders `ConcurrencyConflictBanner` on `409 Conflict`. 15/15 component tests pass cleanly. Approved! |
| 69 | feature/28-dashboard-api | Approved: Verified authoritative dashboard APIs: `GET /api/dashboard/staff` (7 KPI metric cards, workload breakdowns, average resolution time with safe zero-division, and recent 10 tickets) and `GET /api/dashboard/requester` (active tickets, waiting input count, recent 5 tickets scoped strictly to session user). Fast indexed aggregation queries execute in $< 200\text{ms}$. 20/20 dashboard API tests pass. Approved! |
| 70 | feature/29-staff-dashboard-ui | Changes Requested → Approved: Initial review caught drill-down filter alignment and URL state persistence. Updated `StaffDashboard` with 7 interactive KPI cards, keyboard focus rings (`2px solid #006B3C`), zero horizontal overflow, and drill-down navigation to pre-filtered `StaffTicketQueue`. Responsive table collapses on mobile. Re-verified and approved! |
| 71 | feature/30-requester-dashboard-ui | Changes Requested → Approved: Initial review noted filter lifecycle state persistence across tab switches and location listeners. Fixed user reference in location listener and gated redirects. Verified Requester Dashboard metrics, "Action Required" amber banner for `WAITING_FOR_REQUESTER` tickets, and 1-click drill-downs into `/tickets`. Re-verified and approved! |
| 72 | feature/31-e2e-inspection-docs | Approved: Verified Playwright E2E test suites (`actions-taken-flow.spec.ts`, `dashboards.spec.ts`, `ticket-resolution.spec.ts`) passing 100%. Visual & responsive inspection script captured all required screenshots across Desktop, Tablet, and Mobile viewports with verified zero horizontal scroll ($w \le 100\text{vw}$). Full system regression confirms 100% pass across all unit, integration, and E2E suites for Labs 1 through 4. Ready for merge to staging and release to `main`! |

## Pull Requests I reviewed for my partner

### feat/lab4-specification
**My comment:** Reviewed all specification markdown files under `docs/lab-04/`. The engineering contract clearly specifies the parent-child Actions Taken model, Resolution Gate workflow constraints (HTTP 422 diagnostic array), Optimistic Concurrency Control (HTTP 409 STALE_UPDATE), and dual Operations & Requester Dashboards. Acceptance Criteria (AC-01..18) are completely mapped in `tests.md`. Ready to merge into staging!  
**Partner's response:** Thanks for the review! Merging into lab4-staging now.

### feat/lab4-database-schema-evolution
**My comment:** Checked out the branch, inspected Prisma schema, and verified migrations and seed script.
- `ActionTaken` model created with foreign keys (`ticketId`, `performerId`), indexes, and cascade delete on ticket removal.
- `Ticket` model updated with additive resolution columns (`resolvedAt`, `closedAt`, `resolutionSummary`).
- Down-migration rollback script (`rollback.sql`) verified and tested.
- Seed script populates diverse tickets with 0, 1, and multiple actions idempotently.  
Approved and good to merge!  
**Partner's response:** Thanks! Merged.

### feat/lab4-actions-taken-api
**My comment:** Approved! Checked backend Actions Taken API implementation:
- `POST /api/tickets/:id/actions` validates mandatory description/result and enforces conditional `followUpNote` when `followUpRequired = true`.
- `PATCH /api/tickets/:id/actions/:actionId` allows editing with OCC timestamp check.
- Action performer is accurately recorded without mutating ticket owner, and `claimTicket: true` assigns ticket to performer on unassigned tickets.
- Requester ownership scoping enforced (`403 Forbidden` for non-owners or mutation attempts).  
**Partner's response:** -

### feat/lab4-ticket-workflow-resolution-gate
**My comment:** Approved!
- Transition to `RESOLVED` enforces Resolution Gate: requires $\ge 1$ Action Taken and resolution summary $\ge 10$ characters, returning `422 Unprocessable Entity` with structured diagnostic array when criteria are unmet.
- Atomic OCC enforcement via Prisma `updateMany` prevents race conditions and returns `409 Conflict` (code `STALE_UPDATE`) when `expectedUpdatedAt` does not match.
- Role-based authorization checked prior to OCC.
- Reopening tickets cleanly resets `resolvedAt` and `closedAt` to null.  
**Partner's response:** -

### feat/lab4-actions-taken-ui
**My comment:** Approved!
- Actions Taken feed renders chronologically with performer badges, follow-up alerts, and attachment notes.
- Action Taken modal handles both creation and edit modes with inline validation feedback.
- Requester detail view displays actions in read-only mode, completely hiding action creation and modification controls.
- Component test suite passes 100%.  
**Partner's response:** -

### feat/lab4-ticket-workflow-ui
**My comment:** Approved!
- Status transition modals guide staff through resolution with real-time checklist validation.
- Resolution Gate checklist dynamically checks off items as summary is entered ($\ge 10$ chars) and actions exist.
- Concurrency conflict banner renders on `409 Conflict`, allowing user to discard changes or refresh.
- Permitted status transition matrix correctly governs available buttons.  
**Partner's response:** -

### feat/lab4-dashboard-api
**My comment:** Approved!
- `GET /api/dashboard/staff` computes all 7 KPI counts (Unassigned, My Assigned, In Progress, Waiting for Requester, High/Urgent, Total Open, Resolved Today) and average resolution time with safe zero division.
- `GET /api/dashboard/requester` returns active tickets count, action required count, and recent 5 tickets scoped strictly to authenticated requester.
- Queries execute in under 200ms.  
**Partner's response:** -

### feat/lab4-staff-dashboard-ui
**My comment:** Approved!
- Operations Dashboard renders 7 interactive KPI metric cards in responsive CSS grid.
- Keyboard navigation tab focus rings display distinct `2px solid #006B3C` Zen Green indicator.
- Clicking any KPI metric card smoothly navigates to Staff Ticket Queue with pre-filtered parameters.
- Recent tickets table provides quick access to operational tickets.  
**Partner's response:** -

### feat/lab4-requester-dashboard-ui
**My comment:** Approved!
- Requester Dashboard provides clear overview of personal support requests.
- Amber alert banner highlights tickets in `WAITING_FOR_REQUESTER` status requiring requester feedback.
- One-click navigation drills down into My Tickets with query filters preserved.
- Fully responsive across desktop, tablet, and mobile viewports.  
**Partner's response:** -

### feat/lab4-e2e-inspection
**My comment:** Approved!
- All Playwright E2E test suites (`e2e/lab-04/`) pass 100%.
- Screenshot evidence generated across desktop, tablet, and mobile breakpoints with verified zero horizontal scroll.
- Full regression verification confirms 100% pass across all unit, integration, and E2E suites for Labs 1 through 4.
- Ready for final release to `main`!  
**Partner's response:** Thanks! Merging now.
