# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal

The goal of Lab 4 is to establish an ITIL-aligned, accountable operations engineering contract for TokTickIT. This sprint transitions TokTickIT from basic ticket handling and internal notes into a structured service delivery workbench. It introduces:
1. **Actions Taken Lines (Parent-Child Sub-Workflow):** Managing discrete operational action lines under a ticket (Parent Ticket $\rightarrow$ Child Action Taken lines), capturing Action Date/Time, Description, Result, Performed by, Follow-Up Required toggle, Follow-Up Note (mandatory when follow-up is required), and Attachment Notes.
2. **Action Editability & Performer Decoupling:** Allowing IT Staff and Administrators to both create and update Action Taken records (with optimistic concurrency control), enabling multiple engineers to contribute actions while attributing work accurately to the performer without altering overall ticket ownership.
3. **Requester Visibility into Actions Taken:** Enabling Requesters to view Actions Taken in read-only mode on their own tickets, fostering communication transparency while reserving action creation/modification strictly to IT Staff.
4. **Strict Resolution Gate:** Preventing premature ticket closure by enforcing that a ticket cannot transition to `RESOLVED` or `CLOSED` unless: (a) at least one Action Taken line exists on the ticket, and (b) a non-empty resolution summary ($\ge 10$ characters) is provided.
5. **Operational Dashboards for Staff and Requesters:**
   - **Staff Dashboard:** Real-time visibility into queue health via KPI metric cards (Total Open, Unassigned, Owned by Me, Waiting for Requester, Urgent/High Open, Resolved Today, Avg Resolution Time), Recent Tickets list, and interactive drill-down navigation to pre-filtered queue views.
   - **Requester Dashboard:** Personalized self-service hub showing My Active Tickets, Waiting for My Input, Recently Resolved tickets, and quick creation entry points.
6. **Concurrency Protection & Safe Database Migration:** Specifying optimistic concurrency control (`updatedAt` timestamp matching / `409 Conflict`) for ticket and action updates, alongside a verified zero-loss database migration and clean rollback plan.

---

## 2. Stakeholder Request Interpretation

Operational stakeholders require TokTickIT to deliver accountability, visibility, and data integrity:

- **IT Support Engineers (Staff):** Need a dedicated structure to record and update concrete technical interventions (Actions Taken lines). Engineers must be able to revise earlier action descriptions, update results, or flag necessary follow-up tasks as troubleshooting evolves. Work must be accurately attributed to the performing engineer, even when assisting on a ticket owned by another colleague.
- **Service Desk Managers:** Require assurance that tickets cannot be marked "Resolved" without documented technical interventions and an explanatory resolution summary (the "Resolution Gate"). Managers also require the Staff Dashboard to highlight unassigned backlog, critical items, and individual engineer workloads ("Owned by Me") alongside team resolution velocity.
- **Requesters:** Need transparency into progress. Requesters must be able to view the Actions Taken on their own tickets so they know what steps IT has attempted, while being protected from seeing other users' ticket actions. Requesters also need their own dedicated Dashboard summarizing their active requests and highlighting tickets waiting on their feedback (`WAITING_FOR_REQUESTER`).
- **DevOps & Architecture:** Require robust data integrity: optimistic locking to prevent concurrent overwrite collisions (stale updates) and a fully reversible database migration strategy with verified rollback safety.

---

## 3. Scope

### Included
- **Actions Taken Lines (Parent-Child Sub-Workflow):**
  - Parent-child relation: `Ticket` (Parent) $\rightarrow$ `ActionTaken` lines (Children).
  - Required fields: Action Date/Time (`actionDateTime`), Description (`description`), Result (`result`), Performed By (`performedBy` / `performerId`), Follow-Up Required? (`followUpRequired`), Follow-up Note (`followUpNote`, mandatory if follow-up required), Attachment Notes (`attachmentNotes`).
  - Full CRUD lifecycle for IT Staff & Admin: Creating (`POST`) and Updating (`PATCH`) Action Taken records.
  - Requester read-only visibility: Requesters can view Actions Taken lines on their owned tickets (`GET`).
- **Ticket Ownership vs. Action Performer Decoupling:**
  - Recording `performerId` (authenticated user executing the action) independently from `ownerId` (ticket owner).
  - Optional quick-claim action when logging an action on an unassigned ticket.
- **Resolution Gate:**
  - Enforcing preconditions prior to transitioning status to `RESOLVED` or `CLOSED`:
    1. At least one `ActionTaken` child line must exist on the ticket.
    2. A non-empty `resolutionSummary` ($\ge 10$ characters) must be submitted.
  - HTTP `422 Unprocessable Entity` response detailing specific gate failures.
- **Operational Dashboards & Metric Drill-Down:**
  - **Staff Operations Dashboard (`/staff/dashboard`):** 7 KPI metric cards (Total Open, Unassigned, Owned by Me, Waiting for Requester, Urgent/High Open, Resolved Today, Avg Resolution Time), Recent Tickets table, queue distribution widgets, and URL drill-down navigation to `/staff/tickets`.
  - **Requester Dashboard (`/dashboard`):** Personalized KPI cards (Total Active Tickets, Waiting for My Input, Resolved Recently), Recent Ticket Activity list, and direct links to My Tickets and Create Ticket.
- **Concurrency Control & Database Migration Strategy:**
  - Optimistic locking via `updatedAt` / `version` returning `409 Conflict` on stale updates.
  - Additive Prisma schema migration and clean, reversible rollback plan.

### Excluded
- Ticket-to-ticket multi-tier nesting (problem-incident hierarchies are simplified to Ticket $\rightarrow$ Action Taken child lines per handout).
- Requester creation or modification of Actions Taken (Requesters have read-only access).
- Automated external SMS/pager alerting (e.g. PagerDuty).
- Complex custom formula report builders or third-party BI tool exports.

---

## 4. Functional Requirements

| FR ID | Functional Requirement Statement | Target Role |
|---|---|---|
| **FR-01** | The system shall allow IT Staff and Administrators to create an Action Taken child line on any ticket, capturing Action Date/Time, Description, Result, Follow-Up Required toggle, Follow-up Note, and Attachment Notes. | IT Staff, Admin |
| **FR-02** | The system shall automatically record the authenticated user as the `performedBy` user on any created Action Taken record. | IT Staff, Admin |
| **FR-03** | The system shall allow IT Staff and Administrators to update an existing Action Taken record (editing Description, Result, Follow-Up Required, Follow-up Note, Attachment Notes). | IT Staff, Admin |
| **FR-04** | The system shall enforce that when `followUpRequired` is `true`, a valid `followUpNote` ($\ge 5$ characters) must be provided. | IT Staff, Admin |
| **FR-05** | The system shall allow Requesters to view all Actions Taken records on tickets they own in read-only mode. | Requester |
| **FR-06** | The system shall block Requesters from creating, updating, or deleting Action Taken records, returning `403 Forbidden`. | Requester |
| **FR-07** | The system shall block Requesters from viewing Actions Taken on tickets owned by another user, returning `403 Forbidden` or `404 Not Found`. | Requester |
| **FR-08** | The system shall display a chronological activity feed of Actions Taken lines on the Ticket Detail screen for Staff and Requesters. | All |
| **FR-09** | The system shall allow an IT Staff member to log an Action Taken on an unassigned ticket or a ticket owned by another staff member without forcing ticket ownership reassignment. | IT Staff, Admin |
| **FR-10** | The system shall allow an IT Staff member creating an action on an unassigned ticket to optionally claim ownership of the ticket simultaneously. | IT Staff, Admin |
| **FR-11** | The system shall enforce a mandatory Resolution Gate preventing transition to `RESOLVED` or `CLOSED` unless at least one Action Taken line exists on the ticket. | System |
| **FR-12** | The system shall enforce that transitioning a ticket to `RESOLVED` requires a non-empty `resolutionSummary` of at least 10 characters. | IT Staff, Admin |
| **FR-13** | The system shall reject resolution attempts failing gate criteria with HTTP `422 Unprocessable Entity` detailing the specific unmet conditions. | System |
| **FR-14** | The system shall provide an IT Staff Operations Dashboard (`/staff/dashboard`) displaying metric cards for Total Open, Unassigned, Owned by Me, Waiting for Requester, Urgent/High Open, Resolved Today, and Average Resolution Time. | IT Staff, Admin |
| **FR-15** | The system shall display a "Recent Tickets" table on the Staff Dashboard showing recently updated tickets with direct detail navigation. | IT Staff, Admin |
| **FR-16** | The system shall support interactive drill-down navigation from each Staff Dashboard metric card to `/staff/tickets` with corresponding pre-filtered query parameters. | IT Staff, Admin |
| **FR-17** | The system shall provide a Requester Dashboard (`/dashboard`) displaying personalized metrics: Total Active Tickets, Waiting for My Input, and Resolved Recently. | Requester |
| **FR-18** | The system shall display a Recent Ticket Activity list on the Requester Dashboard with quick actions to view ticket details or respond to pending items. | Requester |
| **FR-19** | The system shall support interactive drill-down navigation from Requester Dashboard metric cards to `/tickets` (My Tickets) with pre-applied status filters. | Requester |
| **FR-20** | The system shall enforce optimistic concurrency control on ticket status/owner updates and action updates, rejecting stale mutations with HTTP `409 Conflict`. | System |
| **FR-21** | The system shall calculate Average Resolution Time across tickets resolved within the last 30 days, safely returning `0` if zero tickets were resolved. | System |
| **FR-22** | The system shall provide a verified, clean database migration and reverse rollback script leaving Lab 3 schema intact without data loss. | System |

---

## 5. Business Rules

| BR ID | Business Rule Statement | Category |
|---|---|---|
| **BR-01** | **Parent-Child Ticket-to-Action Relationship:** Each Ticket acts as a Parent record having zero or more child `ActionTaken` line items. Deleting a ticket (if performed) cascades to its child actions. Actions Taken cannot exist without an associated parent ticket. | Data Model |
| **BR-02** | **Action Taken Mandatory Fields:** An Action Taken line must contain: `actionDateTime` (valid ISO date/time), `description` (10 to 2,000 characters), `result` (3 to 500 characters), `performedById` (valid active IT Staff/Admin user), and `followUpRequired` (boolean). | Validation |
| **BR-03** | **Follow-up Note Conditional Mandate:** If `followUpRequired` is `true`, `followUpNote` is mandatory and must contain between 5 and 1,000 characters. If `followUpRequired` is `false`, `followUpNote` is optional and may be null or empty. | Validation |
| **BR-04** | **Attachment Notes Specification:** `attachmentNotes` is an optional string (max 500 characters) used to record reference filenames, tool output references, or diagnostic artifact paths. | Validation |
| **BR-05** | **Action Editability & Auditability:** IT Staff and Administrators may update existing Actions Taken (`description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`). The original `performedById` and `actionDateTime` remain preserved, while `updatedAt` is updated to record modification time. | Editability |
| **BR-06** | **Requester Read-Only Access:** Requesters may view Actions Taken lines on their own tickets (`ticket.requesterId === currentUser.id`). Requesters cannot create, edit, or delete Actions Taken. Any mutation attempt by a Requester returns `403 Forbidden`. | Authorization |
| **BR-07** | **Requester Ownership Isolation:** Requesters attempting to view Actions Taken on tickets they do not own must be rejected with `403 Forbidden` or `404 Not Found` without disclosing metadata. | Security |
| **BR-08** | **Action Performer Autonomy:** Any active IT Staff or Administrator may log or edit an Action Taken on any ticket, regardless of whether the ticket is unassigned or owned by another user. Logging an action does not alter `ownerId` unless explicitly requested. | Ownership |
| **BR-09** | **Simultaneous Ticket Claim:** When logging an Action Taken on an unassigned ticket (`ownerId IS NULL`), setting `claimTicket = true` simultaneously assigns `ownerId` to the authenticated performer. | Ownership |
| **BR-10** | **Status Transition State Machine:** Permitted transitions: <br>- `NEW` $\rightarrow$ `OPEN`, `IN_PROGRESS`, `CANCELLED`<br>- `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`<br>- `REOPENED` $\rightarrow$ `IN_PROGRESS`, `RESOLVED` *(Gate Required)*<br>- `CLOSED` and `CANCELLED` are terminal states. Invalid transitions return `400 Bad Request`. | Workflow |
| **BR-11** | **Resolution Gate - Mandatory Action Taken:** A ticket cannot transition to `RESOLVED` or `CLOSED` unless at least one (`count >= 1`) child `ActionTaken` record is attached to the ticket. | Resolution Gate |
| **BR-12** | **Resolution Gate - Mandatory Resolution Summary:** Transitioning to `RESOLVED` requires a non-empty `resolutionSummary` of at least 10 characters and at most 2,000 characters explaining how the issue was remediated. | Resolution Gate |
| **BR-13** | **Resolution Gate Diagnostics (422):** If resolution prerequisites are not met, the API returns HTTP `422 Unprocessable Entity` with an error details array indicating `MISSING_ACTION_TAKEN` and/or `MISSING_RESOLUTION_SUMMARY`. | API & Errors |
| **BR-14** | **Resolution Timestamps:** Transitioning to `RESOLVED` stamps `resolvedAt = NOW()`. Transitioning to `CLOSED` stamps `closedAt = NOW()`. Reopening a ticket (`REOPENED`) resets `resolvedAt` and `closedAt` to `null`. | Data Lifecycle |
| **BR-15** | **Requester Problem Appears Resolved:** When a Requester triggers "Problem Appears Resolved", the status transitions to `WAITING_FOR_REQUESTER` (awaiting staff verification), not directly to `RESOLVED`. Direct resolution is restricted to Staff and Admins. | Workflow |
| **BR-16** | **Optimistic Concurrency Control (OCC):** Ticket status/owner mutations and Action updates must supply the `expectedUpdatedAt` timestamp. If the database record's `updatedAt` is newer than `expectedUpdatedAt`, the server rejects the request with HTTP `409 Conflict` (code `STALE_UPDATE`). | Concurrency |
| **BR-17** | **Staff Dashboard - Metric Calculations:**<br>- *Total Open:* count of active tickets (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`).<br>- *Unassigned:* count of active tickets where `ownerId IS NULL`.<br>- *Owned by Me:* count of active tickets where `ownerId === currentUserId`.<br>- *Waiting for Requester:* count where `currentStatus = 'WAITING_FOR_REQUESTER'`.<br>- *Urgent / High:* count where `itPriority IN ('URGENT', 'HIGH')` and ticket is active.<br>- *Resolved Today:* count where `resolvedAt` falls within today's local date bounds.<br>- *Average Resolution Time:* $\frac{\sum (\text{resolvedAt} - \text{createdAt})}{N}$ in minutes for tickets resolved in the last 30 days. Safe zero division returns 0. | Dashboard |
| **BR-18** | **Staff Dashboard - Recent Tickets List:** Returns the 10 most recently updated tickets across the system with Ticket Number, Summary, Requester Name, IT Priority, Status badge, Owner, and relative `updatedAt` timestamp. | Dashboard |
| **BR-19** | **Staff Dashboard - Drill-Down URL Mapping:** Clicking metric cards maps to `/staff/tickets`: <br>- *Total Open:* `?status=open`<br>- *Unassigned:* `?ownership=unassigned`<br>- *Owned by Me:* `?ownership=me`<br>- *Waiting for Requester:* `?status=WAITING_FOR_REQUESTER`<br>- *Urgent/High:* `?priority=URGENT,HIGH&status=open`<br>- *Resolved Today:* `?status=RESOLVED&resolvedRange=today` | Drill-Down |
| **BR-20** | **Requester Dashboard - Metric Calculations:**<br>- *Total Active:* count of owned tickets in `['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']`.<br>- *Waiting for My Input:* count of owned tickets in `'WAITING_FOR_REQUESTER'`.<br>- *Resolved Recently:* count of owned tickets resolved in the last 7 days. | Requester Dash |
| **BR-21** | **Requester Dashboard - Recent Activity List:** Returns the 5 most recently updated owned tickets with Ticket Number, Summary, Status badge, and a callout highlighting if action/reply is required. | Requester Dash |
| **BR-22** | **Requester Dashboard - Drill-Down URL Mapping:** Clicking metric cards maps to `/tickets`: <br>- *Total Active:* `?status=active`<br>- *Waiting for My Input:* `?status=WAITING_FOR_REQUESTER`<br>- *Resolved Recently:* `?status=RESOLVED` | Drill-Down |
| **BR-23** | **Migration Rollback Safety:** Dropping the `actions_taken` table and reverting added columns on `tickets` must execute cleanly without data loss or corruption of Lab 2 and Lab 3 tables. | Database |
| **BR-24** | **Backward Compatibility:** All existing Lab 1 category seed, Lab 2 Requester tickets/attachments, and Lab 3 RBAC, password security, comments, notes, and user administration remain 100% operational. | Regression |

---

## 6. UI Specification Summary

1. **Staff Operations Dashboard (`/staff/dashboard`):**
   - 7 Zen Green metric cards in a responsive grid: Total Open, Unassigned, Owned by Me, Waiting for Requester, Urgent/High Open, Resolved Today, and Avg Resolution Time.
   - Distinctive 5px left-border accent, large numeric display (`2.25rem`), hover elevation (`translateY(-2px)`), keyboard focus rings, and direct drill-down links to `/staff/tickets`.
   - "Recent Tickets" table displaying the latest 10 updated tickets with status badges and quick-view actions.
   - Status, priority, and category queue breakdown bars.
2. **Requester Dashboard (`/dashboard`):**
   - Clean, self-service dashboard tailored for Requesters.
   - 3 focused metric cards: Active Tickets, Waiting for My Input (amber highlight), and Resolved Recently.
   - "Recent Ticket Activity" list displaying recent updates and clear action prompts when waiting for user response.
   - Prominent "+ Create New Ticket" primary Zen Green action button.
3. **Actions Taken Activity Feed & Modals (`/staff/tickets/:id` & `/tickets/:id`):**
   - **Staff View:** Chronological timeline showing Action Date/Time, Description, Result, Performer, Follow-up badge (`Follow-up Required: Yes/No`), Follow-up Note, Attachment Notes, and an "Edit Action" action link on each card. Features a "+ Log Action Taken" button opening the creation modal.
   - **Requester View:** Read-only chronological Actions Taken feed. Displays all actions taken by IT staff so the Requester can track remediation steps. Create/Edit controls are completely hidden.
   - **Create / Edit Action Modal:** Form fields: Action Date/Time picker (defaults to now), Description textarea (required), Result text (required), Follow-Up Required toggle switch, Follow-up Note textarea (dynamically required if toggle is checked), Attachment Notes input, and optional "Claim Ticket" toggle (for unassigned tickets).
4. **Resolution Gate Modal (`/staff/tickets/:id`):**
   - Triggered when changing status to `RESOLVED`.
   - Live checklist verifying:
     - `✓ At least 1 Action Taken recorded` (or red warning with link to log an action).
     - `✓ Resolution Summary provided (min 10 characters)`.
   - Resolution summary textarea with live character counter. Submit button disabled until checklist is fully satisfied.
5. **Concurrency Conflict Alert Modal:**
   - Displays when a `409 Conflict` (stale update) occurs during ticket status update or action editing.
   - Informs the user: *"This record was modified by another user while you were editing. Please refresh to load the latest changes."* Provides a "Reload Latest" button.

---

## 7. Database Evolution and Migration Strategy

### Prisma Schema Models & Extensions

```prisma
// Model Extension: Ticket
model Ticket {
  id                String            @id @default(cuid())
  ticketNumber      String            @unique
  summary           String
  description       String            @db.Text
  categoryId        String
  category          Category          @relation(fields: [categoryId], references: [id])
  relatedSystemId   String
  relatedSystem     RelatedSystem     @relation(fields: [relatedSystemId], references: [id])
  requestedPriority RequestedPriority @default(MEDIUM)
  itPriority        ITPriority        @default(MEDIUM)
  currentStatus     TicketStatus      @default(NEW)
  
  requesterId       String
  requester         User              @relation("TicketRequester", fields: [requesterId], references: [id])
  
  ownerId           String?
  owner             User?             @relation("TicketOwner", fields: [ownerId], references: [id])
  
  // Lab 4: Resolution Gate Metadata
  resolvedAt        DateTime?
  closedAt          DateTime?
  resolutionSummary String?           @db.Text
  
  // Existing Relations
  attachments       Attachment[]
  publicComments    PublicComment[]
  internalNotes     InternalNote[]
  
  // Lab 4: Parent-Child Relation (Ticket -> Child ActionTaken lines)
  actionsTaken      ActionTaken[]
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([requesterId])
  @@index([ownerId])
  @@index([currentStatus])
  @@index([itPriority])
  @@index([resolvedAt])
  @@map("tickets")
}

// Lab 4: New ActionTaken Model (Parent-Child child lines)
model ActionTaken {
  id                String    @id @default(cuid())
  ticketId          String
  ticket            Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedById     String
  performedBy       User      @relation("ActionPerformer", fields: [performedById], references: [id])
  actionDateTime    DateTime  @default(now())
  description       String    @db.Text
  result            String    @db.Text
  followUpRequired  Boolean   @default(false)
  followUpNote      String?   @db.Text
  attachmentNotes   String?   @db.Text
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
  @@map("actions_taken")
}

// Model Extension: User relation update
// User model adds: actionsPerformed ActionTaken[] @relation("ActionPerformer")
```

### Architectural Design Choice Justifications

#### Design Choice 1: Relational 1-to-Many Parent-Child (Ticket $\rightarrow$ ActionTaken Lines)
- **Alternative Considered:** Storing action items as a denormalized JSON array column (`actions_json`) inside the `tickets` table.
- **Justification for Chosen Design:**
  1. *Query Performance and Indexing:* Normalizing Actions Taken into a dedicated `actions_taken` table with a foreign key to `tickets` permits efficient, indexed querying, pagination, and sorting on `actionDateTime` and `performedById` without parsing JSON payloads.
  2. *Referential Integrity & User Attribution:* Foreign key constraints guarantee that `performedById` maps to a valid user. When user records or tickets are referenced, database-level cascade and foreign key constraints preserve referential integrity.
  3. *Resolution Gate & Concurrency Control:* Evaluating the Resolution Gate (`COUNT(actions_taken) >= 1`) executes via a lightweight indexed SQL query (`SELECT COUNT(*) FROM actions_taken WHERE ticket_id = :id`). In addition, individual action updates can be isolated with their own `updatedAt` concurrency timestamps without locking the entire ticket table.

#### Design Choice 2: Dedicated Normalized `ActionTaken` Model vs. Overloading `InternalNote`
- **Alternative Considered:** Adding nullable result and follow-up columns to the existing `internal_notes` table with a discriminator flag.
- **Justification for Chosen Design:**
  1. *Distinct Operational Semantics & Requester Visibility:* Internal notes are private, unstructured discussions strictly forbidden from Requesters (`403 Forbidden`). Actions Taken are formal remediation records that Requesters **can view** on their own tickets to track technical progress. Combining them would create severe data leakage risks.
  2. *Strict Schema Enforcement for Handout Requirements:* The Lab 4 handout specifies mandatory operational fields (`actionDateTime`, `description`, `result`, `followUpRequired`, `followUpNote`). A normalized model allows enforcing mandatory fields cleanly without polluting conversational note tables.

### Database Migration & Rollback Strategy

#### Migration Plan (`20261028_lab4_actions_taken_and_resolution`)
1. Create table `actions_taken` with columns: `id`, `ticketId`, `performedById`, `actionDateTime`, `description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `createdAt`, `updatedAt`.
2. Add foreign key constraints on `ticketId` (referencing `tickets(id)` with `ON DELETE CASCADE`) and `performedById` (referencing `users(id)`).
3. Add nullable columns `resolvedAt` (timestamp), `closedAt` (timestamp), and `resolutionSummary` (text) to `tickets`.
4. Create indexes on `actions_taken(ticketId)`, `actions_taken(performedById)`, and `tickets(resolvedAt)`.

#### Verified Rollback Plan
In the event of a deployment rollback:
```sql
-- Down migration script
DROP TABLE IF EXISTS "actions_taken" CASCADE;
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "resolvedAt";
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "closedAt";
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "resolutionSummary";
```
Execution of the down migration cleanly removes the Lab 4 additions without impacting any existing Lab 1, 2, or 3 data structures.

---

## 8. API Contract Summary

| Method | Endpoint Path | Permitted Roles | Description | Success Code |
|---|---|---|---|---|
| `GET` | `/api/tickets/:id/actions` | IT Staff, Admin, Requester (owner) | Retrieve chronological list of Actions Taken on a ticket | `200 OK` |
| `POST` | `/api/tickets/:id/actions` | IT Staff, Admin | Create a new Action Taken line on a ticket | `201 Created` |
| `PATCH` | `/api/tickets/:id/actions/:actionId` | IT Staff, Admin | Update an existing Action Taken record (OCC protected) | `200 OK` |
| `PATCH` | `/api/tickets/:id/status` | IT Staff, Admin, Requester (resolve signal) | Update ticket status; enforces Resolution Gate if target is `RESOLVED` | `200 OK` |
| `GET` | `/api/dashboard/staff` | IT Staff, Admin | Retrieve Staff KPI metrics, "Owned by Me" count, and Recent Tickets | `200 OK` |
| `GET` | `/api/dashboard/staff/breakdown` | IT Staff, Admin | Retrieve Staff queue distributions (status, priority, category) | `200 OK` |
| `GET` | `/api/dashboard/requester` | Requester | Retrieve Requester KPI metrics and Recent Ticket Activity | `200 OK` |

---

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion Statement |
|---|---|
| **AC-01** | Given an authenticated IT Staff or Admin user, when submitting a valid Action Taken (`POST /api/tickets/:id/actions`), then the action is persisted with `actionDateTime`, `description`, `result`, `performedById`, `followUpRequired`, `followUpNote`, and `attachmentNotes`, returning `201 Created`. |
| **AC-02** | Given an Action Taken creation request with `followUpRequired = true`, when `followUpNote` is missing or under 5 characters, then the request is rejected with `400 Bad Request`. |
| **AC-03** | Given an unassigned ticket, when an IT Staff member logs an Action Taken with `claimTicket: true`, then the action is created and ticket `ownerId` is assigned to the authenticated user. |
| **AC-04** | Given an existing Action Taken record, when an IT Staff or Admin user submits an update (`PATCH /api/tickets/:id/actions/:actionId`) with valid fields, then the record is updated, `updatedAt` is refreshed, and `200 OK` is returned. |
| **AC-05** | Given an update request for an Action Taken or Ticket with a stale `expectedUpdatedAt`, when submitted, then the server rejects the update with `409 Conflict` (code `STALE_UPDATE`). |
| **AC-06** | Given an authenticated Requester viewing their own ticket, when requesting Actions Taken (`GET /api/tickets/:id/actions`), then the list of actions taken by IT Staff is returned with HTTP `200 OK`. |
| **AC-07** | Given an authenticated Requester, when attempting to call `POST` or `PATCH` on Actions Taken, or attempting to view actions on another user's ticket, then the request is rejected with `403 Forbidden`. |
| **AC-08** | Given an IT Staff user logging an action on a ticket owned by another staff member, then the action is saved with the current user as `performedBy`, while the ticket's `ownerId` remains unchanged. |
| **AC-09** | Given a ticket with zero recorded Actions Taken, when an IT Staff user attempts to transition status to `RESOLVED`, then the request is rejected with `422 Unprocessable Entity` (code `MISSING_ACTION_TAKEN`). |
| **AC-10** | Given a ticket with recorded actions but missing a `resolutionSummary` ($\ge 10$ characters), when transitioning to `RESOLVED`, then the request is rejected with `422 Unprocessable Entity` (code `MISSING_RESOLUTION_SUMMARY`). |
| **AC-11** | Given a ticket satisfying all Resolution Gate criteria (has actions and resolution summary), when transitioning to `RESOLVED`, then the status updates, `resolvedAt` is stamped, and `200 OK` is returned. |
| **AC-12** | Given an IT Staff or Admin user accessing `/staff/dashboard`, then the system renders 7 KPI metric cards including "Owned by Me" and a "Recent Tickets" table. |
| **AC-13** | Given an IT Staff user viewing the Staff Dashboard, when clicking any metric card, then the application navigates to `/staff/tickets` with corresponding filters pre-applied. |
| **AC-14** | Given an authenticated Requester accessing `/dashboard`, then the system renders personalized KPI cards (Active Tickets, Waiting for My Input, Resolved Recently) and Recent Ticket Activity. |
| **AC-15** | Given a Requester clicking a metric card on their dashboard, then the application navigates to `/tickets` with pre-applied status filters. |
| **AC-16** | Given an active system with zero resolved tickets in the last 30 days, when dashboard metrics are requested, then `avgResolutionMinutes` returns `0` safely without zero-division errors. |
| **AC-17** | Given responsive viewports (Desktop $\ge 992\text{px}$, Tablet $768-991\text{px}$, Mobile $< 768\text{px}$), then Staff Dashboard, Requester Dashboard, and Ticket Detail feeds adapt cleanly without horizontal overflow. |
| **AC-18** | Given existing Lab 1, Lab 2, and Lab 3 data structures and features, all functionality continues to operate without regression, and the database rollback script executes cleanly. |

---

## 10. Definition of Done

### Product Completion Checklist
- [ ] Complete implementation of Actions Taken lines (CRUD by staff, read-only by Requesters).
- [ ] Implementation of Staff Dashboard with "Owned by Me" and Recent Tickets list.
- [ ] Implementation of Requester Dashboard with "Waiting for My Input" callouts and recent activity.
- [ ] Server-side enforcement of Resolution Gate (`422 Unprocessable Entity`) on status updates.
- [ ] Optimistic concurrency control (`409 Conflict`) for ticket and action updates.
- [ ] Satisfaction of all Acceptance Criteria (`AC-01` through `AC-18`).
- [ ] Passing automated test suites across Unit, API, UI Component, UI Style, Responsive, Concurrency, Performance Smoke, Migration, and E2E levels.
- [ ] Full compliance with Zen Green design tokens and WCAG AA accessibility.
- [ ] Verified database migration and verified down-migration rollback script.
- [ ] Zero regression of Lab 1, 2, and 3 capabilities.

---

## 11. Assumptions and Decisions

| Decision ID | Choice / Decision | Technical Justification / Context |
|---|---|---|
| **DEC-01** | Ticket $\rightarrow$ ActionTaken Parent-Child Model | Matches Lab 4 handout requirements: Ticket is parent, Action Taken records are child lines. Avoids unnecessary multi-tier ticket recursion. |
| **DEC-02** | Requester Read-Only Visibility for Actions | Promotes service transparency allowing Requesters to see remediation progress while restricting action authoring to qualified staff. |
| **DEC-03** | Editable Actions with Concurrency Lock | IT staff can refine action details as diagnosis progresses. Concurrency timestamps prevent accidental overwrites. |
| **DEC-04** | Dual Dashboards (Staff & Requester) | Staff dashboard focuses on team queue health and individual backlog; Requester dashboard focuses on self-service requests and pending feedback. |
| **DEC-05** | HTTP 422 for Resolution Gate Failures | Clearly distinguishes business precondition failures from invalid payload syntax (`400 Bad Request`). |
| **DEC-06** | Additive Migration with Tested Rollback | Protects existing production and staging database state while providing an immediate recovery mechanism. |
