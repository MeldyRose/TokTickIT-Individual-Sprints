# TokTickIT — Lab 4: Actions Taken, Ticket Workflow & Operational Dashboards

**Course:** CPE 334 Software Engineering  
**Author:** Praewa Thuwatharanimitkul (67070503432) — GitHub: [@MeldyRose](https://github.com/MeldyRose)  
**Peer Reviewer:** Phattaratorn Mahatkeerati (67070503433) — GitHub: [@GGital](https://github.com/GGital)  

---

## 1. Overview & System Scope

**Lab 4** elevates TokTickIT into a production-grade operational IT Service Management (ITSM) system by implementing:
1. **Parent-Child Actions Taken Sub-Workflow:** Discrete chronological operational action lines recorded under tickets (`Parent Ticket` $\rightarrow$ `Child ActionTaken` records), capturing Action Date/Time, Performer, Description, Diagnostic Result, Follow-Up Required toggle, mandatory Follow-Up Note, and Attachment Notes.
2. **Performer Autonomy & Ticket Claiming:** Any IT Staff member or Administrator can record or edit Actions Taken on any ticket without mutating overall ticket ownership. Logging an action on an unassigned ticket with `claimTicket: true` atomically claims ownership for the performer.
3. **Requester Read-Only Visibility:** Requesters have transparent, real-time read access to the chronological Actions Taken timeline on their owned tickets, while all action creation and editing mutations are strictly restricted to IT Staff (`403 Forbidden`).
4. **Resolution Gate Enforcement:** Transitions to `RESOLVED` and `CLOSED` require satisfying the Resolution Gate: requiring $\ge 1$ Action Taken line and a substantive resolution summary ($\ge 10$ characters). Premature attempts return HTTP `422 Unprocessable Entity` with a structured diagnostic array (`MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`).
5. **Optimistic Concurrency Control (OCC):** Stale-update collision detection on ticket and action mutations using atomic Prisma queries (`updateMany` matching `{ id, updatedAt: expectedUpdatedAt }`). Collisions return HTTP `409 Conflict` (code `STALE_UPDATE`), triggering a non-destructive conflict banner in the UI.
6. **Dual Authoritative Operational Dashboards:**
   - **IT Staff Operations Dashboard (`/staff/dashboard`):** 7 interactive KPI metric cards (Unassigned, My Assigned, In Progress, Waiting for Requester, High/Urgent, Total Open, Resolved Today), average resolution time with safe zero-division, and Recent Tickets table with one-click drill-down filtering to `/staff/tickets`.
   - **Requester Dashboard (`/dashboard`):** Active tickets summary, amber "Action Required" alert banner for tickets awaiting user input (`WAITING_FOR_REQUESTER`), recent activity, and one-click drill-down to `/tickets`.
7. **Zen Green Design System & WCAG AA Accessibility:** Keyboard focus rings (`2px solid #006B3C`), distinct color contrast ($\ge 4.5:1$), ARIA roles, and responsive adaptation across Desktop ($\ge 992\text{px}$), Tablet ($768\text{px}-991\text{px}$), and Mobile ($< 768\text{px}$) with zero horizontal scrolling ($w \le 100\text{vw}$).

---

## 2. Architecture & Data Model Evolution

### 2.1 Prisma Schema Evolution

```prisma
model Ticket {
  id                 String           @id @default(cuid())
  ticketNumber       String           @unique
  summary            String
  description        String
  categoryId         String
  relatedSystemId    String
  requestedPriority  RequestedPriority
  itPriority         ITPriority       @default(MEDIUM)
  currentStatus      TicketStatus     @default(NEW)
  requesterId        String
  ownerId            String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  resolvedAt         DateTime?        // Stamped when transitioning to RESOLVED
  closedAt           DateTime?        // Stamped when transitioning to CLOSED
  resolutionSummary  String?          // Required (>=10 chars) for Resolution Gate

  // Relations
  category           Category         @relation(...)
  relatedSystem      RelatedSystem    @relation(...)
  requester          User             @relation("RequesterTickets", ...)
  owner              User?            @relation("AssignedTickets", ...)
  attachments        Attachment[]
  publicComments     PublicComment[]
  internalNotes      InternalNote[]
  actionsTaken       ActionTaken[]    // Child lines (cascade delete)

  @@index([currentStatus])
  @@index([ownerId])
  @@index([requesterId])
  @@index([itPriority])
}

model ActionTaken {
  id                 String           @id @default(cuid())
  ticketId           String
  performerId        String
  actionDateTime     DateTime         @default(now())
  description        String
  result             String
  followUpRequired   Boolean          @default(false)
  followUpNote       String?          // Mandatory when followUpRequired = true
  attachmentNotes    String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  ticket             Ticket           @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy        User             @relation("PerformerActions", fields: [performerId], references: [id])

  @@index([ticketId])
  @@index([performerId])
  @@index([actionDateTime])
}
```

### 2.2 Reversible Database Migration & Rollback
- Additive migration: `server/prisma/migrations/20261028163000_lab4_actions_and_resolutions/migration.sql`
- Rollback script: `docs/lab-04/rollback.sql`
- Verified via automated Vitest suite: `server/tests/lab-04/migration.test.ts`

---

## 3. Seed Credentials & Test Accounts

Run the idempotent seed script to populate test data:

```bash
npm --prefix server run seed
```

| Email | Default Password | Role | Description |
|---|---|---|---|
| `michael.b@example.com` | `Password123!` | `REQUESTER` | Requester with multiple active tickets |
| `sarah.j@example.com` | `Password123!` | `REQUESTER` | Requester with resolved tickets |
| `jennifer.a@example.com` | `Password123!` | `REQUESTER` | Requester requiring initial password reset (`mustChangePassword: true`) |
| `alex.thompson@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer (Ticket queue lead) |
| `lisa.martinez@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer |
| `kevin.patel@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer |
| `admin@toktickit.com` | `Password123!` | `ADMINISTRATOR` | System Administrator (User management & operations) |

---

## 4. REST API Reference (Lab 4)

All protected endpoints enforce server-side cookie authentication (`toktickit_session`) and role-based permissions:

### 4.1 Actions Taken Endpoints

| Method | Endpoint | Permitted Roles | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions` | Requester (owner), Staff, Admin | Retrieve chronological list of actions taken on ticket |
| `POST` | `/api/tickets/:id/actions` | IT Staff, Admin | Record new Action Taken child line (`403` for Requester) |
| `PATCH` | `/api/tickets/:id/actions/:actionId` | IT Staff, Admin | Update existing Action Taken (`403` for Requester; validates OCC) |

### 4.2 Ticket Workflow & Resolution Gate Endpoints

| Method | Endpoint | Permitted Roles | Description |
|---|---|---|---|
| `PATCH` | `/api/tickets/:id/status` | Requester (advisory), Staff, Admin | Update ticket status. Enforces Resolution Gate (`422`) on `RESOLVED`/`CLOSED` and validates OCC (`409 STALE_UPDATE`) |

### 4.3 Operational Dashboard Endpoints

| Method | Endpoint | Permitted Roles | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/staff` | IT Staff, Admin | Retrieve 7 KPI metric counts, workload numbers, resolution velocity, and 10 recent tickets |
| `GET` | `/api/dashboard/requester` | Requester, Staff, Admin | Retrieve active tickets count, waiting-for-input count, and recent 5 tickets for session user |

---

## 5. Running Tests & Verifying Acceptance Criteria

### 5.1 Server Vitest Suite (Unit, Migration, API & Security)
Runs all 23 backend test files covering schema evolution, seed diversity, migration rollback, actions taken CRUD & OCC, resolution gate, and dashboard calculations:

```bash
npm --prefix server test
```
*Expected: 23 test files passed, 191/191 tests passed.*

### 5.2 Client Vitest Suite (UI Components, State & Responsive)
Runs all 18 frontend test files covering Actions Taken feeds, modals, workflow controls, resolution checklists, and dashboards:

```bash
npm --prefix client test -- --run
```
*Expected: 18 test files passed, 126/126 tests passed.*

### 5.3 Playwright End-to-End (E2E) Test Suites
Executes full multi-role browser journeys in Chromium:

```bash
# Seed pristine database state
npm --prefix server run seed

# Run Lab 4 E2E test suites
npx playwright test e2e/lab-04 --workers=1
```
*Expected: 4 passed.*
- `actions-taken-flow.spec.ts`: Staff logs action with follow-up validation, claims unassigned ticket, edits action, requester views read-only.
- `dashboards.spec.ts`: Requester dashboard metrics, action required alert, drill-downs to My Tickets; Staff dashboard 7 KPI cards, queue drill-downs.
- `ticket-resolution.spec.ts`: Full lifecycle from creation $\rightarrow$ in-progress $\rightarrow$ requester problem resolved advisory $\rightarrow$ staff resolution gate enforcement $\rightarrow$ resolution $\rightarrow$ closure.

### 5.4 Visual & Responsive Screenshot Capture
Generates high-resolution PNG evidence across Desktop, Tablet, and Mobile viewports with programmatic zero horizontal overflow assertions:

```bash
npm --prefix server run seed
npx playwright test e2e/capture-lab4-screenshots.spec.ts --workers=1
```
*Expected: 3 passed, 18 screenshots captured in `artifacts/lab-04/screenshots/`.*

### 5.5 Full System Regression Verification
Re-verifies 100% pass rate for legacy suites (Labs 1, 2, and 3):

```bash
npm --prefix server run seed
npx playwright test e2e/lab-03 --workers=1
```
*Expected: 3 passed.*

---

## 6. Screenshot & Inspection Evidence

Captured screenshot artifacts are organized under `artifacts/lab-04/screenshots/`:

- **Staff Operations Dashboard (`staff-dashboard/`):**
  - `01-staff-dashboard-desktop.png`: 7 KPI cards in 4-column desktop grid with Recent Tickets table.
  - `02-staff-dashboard-tablet.png`: 2-column tablet layout (820px) without horizontal scroll.
  - `03-staff-dashboard-mobile.png`: 1-column mobile layout (375px) with collapsible cards.
  - `04-staff-dashboard-focus-ring.png`: Visible `2px solid #006B3C` keyboard tab focus indicator.
  - `05-staff-dashboard-drilldown-queue.png`: Pre-filtered ticket queue on KPI card click.
- **Requester Dashboard (`requester-dashboard/`):**
  - `01-requester-dashboard-desktop.png`: Active tickets, waiting on input, and resolved cards.
  - `02-requester-dashboard-tablet.png`: Responsive tablet layout (820px).
  - `03-requester-dashboard-mobile.png`: Responsive mobile layout (375px).
  - `05-requester-dashboard-drilldown-mytickets.png`: Drill-down to My Tickets with query params preserved.
- **Actions Taken & Resolution Gate (`actions-taken/`):**
  - `01-actions-feed-staff-desktop.png`: Chronological timeline with performer badges and action details.
  - `02-actions-feed-requester-readonly.png`: Read-only action feed without edit/add controls.
  - `03-log-action-modal-empty.png`: Modal form with required field indicators.
  - `04-log-action-modal-followup-validation.png`: Validation error banner when follow-up note is missing.
  - `06-resolution-gate-checklist-blocked.png`: Resolution modal checklist blocking submit (red warnings).
  - `07-resolution-gate-checklist-satisfied.png`: Resolution modal checklist satisfied (green checkmarks).

---

## 7. Sprint Documentation Index

- [Specification Document](file:///docs/lab-04/specification.md) — Detailed requirements, domain model, business rules (BR-01..25), and functional specs.
- [Test Plan & Traceability Matrix](file:///docs/lab-04/tests.md) — Comprehensive test plan, AC-01..18 mapping, responsive checklist, and execution summary.
- [API Specification](file:///docs/lab-04/api-spec.md) — RESTful endpoint contracts, query parameters, schemas, and error responses.
- [UI Specification](file:///docs/lab-04/ui-spec.md) — Wireframes, responsive breakpoint rules, Zen Green design tokens, and modal interactions.
- [Peer Review Record](file:///docs/lab-04/reviewer.md) — Sign-offs, reviewer verdicts, and PR links for PRs #63 through #72.
- [AI Use & Reflection](file:///docs/lab-04/ai-use.md) — 8 selected key prompts and reflection on contract-first engineering with AI.
