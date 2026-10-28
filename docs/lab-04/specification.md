# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal

The goal of Lab 4 is to establish an ITIL-aligned, accountable operations engineering contract for TokTickIT. This sprint elevates the operational service desk from basic ticket tracking and note-taking into a structured service delivery workbench. It introduces:
1. **Actions Taken Sub-Workflow:** Detailed tracking of discrete operational actions (diagnosis, investigation, workaround, vendor escalation, hardware repair, software patch, communication, resolution step) with recorded effort/duration, timestamp, and performer attribution.
2. **Ticket Ownership vs. Action Performer Decoupling:** Enabling collaborative operational interventions by multiple staff members while preserving unambiguous ticket ownership and accountability.
3. **Parent-Child Ticket Hierarchy:** Linking subordinate incident or task tickets under a parent ticket for coordinated resolution, monitoring, and dependency management.
4. **Strict Resolution Gate:** Preventing premature ticket closure by enforcing mandatory operational prerequisites—requiring at least one recorded Action Taken, a mandatory resolution summary, and zero unresolved child tickets prior to transitioning to `RESOLVED` or `CLOSED`.
5. **Operational Dashboards & Metric Drill-Down:** Providing real-time situational awareness for IT Staff and Administrators via high-level KPI metric cards (Total Open, Unassigned, Waiting for Requester, Urgent Open, Resolved Today, Average Resolution Time), status/priority distributions, and interactive drill-down navigation linking directly into pre-filtered ticket queue views.

---

## 2. Stakeholder Request Interpretation

Operational stakeholders (IT Service Desk Managers, Tier-1/Tier-2 Support Engineers, and System Administrators) require TokTickIT to provide greater accountability, auditability, and operational visibility:

- **IT Support Engineers (Staff):** Need a structured mechanism to record concrete interventions taken on a ticket rather than burying technical details in freeform comments or internal notes. When multiple engineers collaborate on a complex issue, the system must clearly distinguish the accountable Ticket Owner from the individual engineers performing specific actions.
- **Service Desk Managers:** Require parent-child ticket coordination to manage major incidents or bundled service requests without losing individual requester context. Managers also require an automated "Resolution Gate" to eliminate the chronic problem of tickets being prematurely marked "Resolved" without documented actions taken or while dependent subtasks remain unresolved.
- **Operations Leadership:** Need a real-time Operational Dashboard that delivers immediate visibility into queue health, backlog accumulation, unassigned tickets, urgent tickets requiring immediate triage, and team resolution velocity. Every metric must be actionable, allowing support personnel to click on any metric card and instantly drill down into the filtered ticket queue.
- **Requesters:** Continue to experience seamless self-service support. Actions Taken and parent-child hierarchies provide transparency or remain internal depending on visibility policy, while the resolution gate ensures issues are genuinely remediated before being closed.

---

## 3. Scope

### Included
- **Actions Taken Sub-Workflow:**
  - Recording operational actions taken on tickets with action category/type (`DIAGNOSIS`, `INVESTIGATION`, `WORKAROUND`, `VENDOR_ESCALATION`, `HARDWARE_REPAIR`, `SOFTWARE_PATCH`, `COMMUNICATION`, `RESOLUTION_STEP`, `OTHER`).
  - Capturing concise action summary, detailed description, time spent (in minutes), and timestamp.
  - Chronological activity feed on Ticket Detail with visual badge indicators.
- **Ownership vs. Action Performer Separation:**
  - Independent recording of `performerId` (the authenticated user executing the action) from `ownerId` (the assigned ticket owner).
  - Permitting any active IT Staff or Administrator to record actions on any ticket.
- **Parent-Child Ticket Hierarchy:**
  - Linking tickets in a single-tier hierarchy (parent ticket to one or more child tickets).
  - Dedicated Parent-Child relationship widget on Ticket Detail displaying linked child tickets and status indicators.
  - Child ticket indicator banner linking directly to the parent ticket.
  - Unlinking capability for mislinked child tickets.
  - Prevention of cyclic dependencies and multi-tier nesting (a child ticket cannot become a parent).
- **Status Workflow & Resolution Gate:**
  - Permitted status transitions updating the state machine from Lab 3.
  - Server-side Resolution Gate blocking transition to `RESOLVED` or `CLOSED` unless:
    1. At least one valid `ActionTaken` record exists on the ticket.
    2. A non-empty `resolutionSummary` ($\ge 10$ characters) is provided.
    3. All linked child tickets are in terminal/resolved states (`RESOLVED`, `CLOSED`, or `CANCELLED`).
  - Distinct HTTP `422 Unprocessable Entity` response detailing specific gate failures when resolution prerequisites are not met.
- **Operational Dashboards & Metric Drill-Down:**
  - Dedicated `/staff/dashboard` screen for IT Staff and Administrators.
  - Metric cards: Total Open Tickets, Unassigned Tickets, Waiting for Requester, Urgent/High Open Tickets, Resolved Today, Average Resolution Time (hours/minutes).
  - Distribution breakdowns: Tickets by Status, IT Priority, and Category.
  - Interactive drill-down navigation: Clicking a metric card routes to `/staff/tickets` with matching query parameters pre-filtered.
- **Data Model Migration & Schema Evolution:**
  - Addition of `ActionTaken` model, `ActionType` enum, self-referential parent-child relations on `Ticket`, and resolution metadata fields (`resolvedAt`, `closedAt`, `resolutionSummary`).
  - Backward compatibility ensuring zero regression for Lab 2 and Lab 3 tickets, users, comments, and attachments.

### Excluded
- Automated multi-level escalation matrices and SLA breach alarms with external paging (e.g., PagerDuty).
- Multi-tier nested ticket hierarchies (parent -> child -> grandchild) or many-to-many problem-incident graphs.
- Direct Requester access to operational dashboards or logging Actions Taken.
- Automated external timecard billing or payroll integration.
- Custom user-configurable dashboard widgets or drag-and-drop report builders.
- Editing or deleting historical Actions Taken records (append-only audit log).

---

## 4. Functional Requirements

| FR ID | Functional Requirement Statement | Target Role |
|---|---|---|
| **FR-01** | The system shall allow IT Staff and Administrators to log discrete "Actions Taken" on any ticket, capturing Action Type, Summary, Details, and Time Spent (in minutes). | IT Staff, Admin |
| **FR-02** | The system shall support standardized Action Types: `DIAGNOSIS`, `INVESTIGATION`, `WORKAROUND`, `VENDOR_ESCALATION`, `HARDWARE_REPAIR`, `SOFTWARE_PATCH`, `COMMUNICATION`, `RESOLUTION_STEP`, and `OTHER`. | IT Staff, Admin |
| **FR-03** | The system shall display a chronological "Actions Taken" activity feed on the Ticket Detail screen, showing the action type badge, performer name, timestamp, duration, summary, and details. | IT Staff, Admin |
| **FR-04** | The system shall automatically record the authenticated user as the `performer` of an Action Taken, regardless of who currently owns the ticket. | IT Staff, Admin |
| **FR-05** | The system shall allow an IT Staff member to log an Action Taken on an unassigned ticket or a ticket assigned to another staff member without forcing re-assignment. | IT Staff, Admin |
| **FR-06** | The system shall allow an IT Staff member logging an action on an unassigned ticket to optionally claim ownership of the ticket simultaneously. | IT Staff, Admin |
| **FR-07** | The system shall allow IT Staff and Administrators to link an active ticket as a child of another ticket, creating a parent-child relationship. | IT Staff, Admin |
| **FR-08** | The system shall display all linked child tickets in a dedicated "Child Tickets" panel on the parent ticket's detail view, showing ticket number, summary, priority, status badge, and assigned owner. | IT Staff, Admin |
| **FR-09** | The system shall display a parent reference banner on any ticket that is a child ticket, displaying the parent ticket number, summary, and a direct clickable link to the parent. | IT Staff, Admin |
| **FR-10** | The system shall allow IT Staff and Administrators to unlink a child ticket from its parent ticket. | IT Staff, Admin |
| **FR-11** | The system shall prevent a child ticket from being linked as a parent to other tickets, enforcing a single-tier hierarchy. | System |
| **FR-12** | The system shall prevent circular linking (a ticket cannot be its own parent or child). | System |
| **FR-13** | The system shall enforce a mandatory "Resolution Gate" when attempting to transition a ticket to `RESOLVED` or `CLOSED`. | System |
| **FR-14** | The Resolution Gate shall verify that at least one `ActionTaken` has been recorded on the ticket prior to allowing resolution. | System |
| **FR-15** | The Resolution Gate shall require the submission of a valid `resolutionSummary` ($\ge 10$ characters) describing how the issue was resolved. | IT Staff, Admin |
| **FR-16** | The Resolution Gate shall verify that all linked child tickets are in a resolved or terminal status (`RESOLVED`, `CLOSED`, or `CANCELLED`) before allowing the parent ticket to resolve. | System |
| **FR-17** | The system shall provide an Operational Dashboard (`/staff/dashboard`) accessible to IT Staff and Administrators. | IT Staff, Admin |
| **FR-18** | The Operational Dashboard shall display primary KPI metric cards: Total Open Tickets, Unassigned Tickets, Waiting for Requester, Urgent/High Open Tickets, Resolved Today, and Average Resolution Time. | IT Staff, Admin |
| **FR-19** | The Operational Dashboard shall display distribution widgets showing ticket breakdowns by Status, IT Priority, and Category. | IT Staff, Admin |
| **FR-20** | The system shall support interactive drill-down navigation from each dashboard metric card and distribution slice directly to `/staff/tickets` with corresponding filters applied. | IT Staff, Admin |
| **FR-21** | The system shall calculate the Average Resolution Time across tickets resolved within the active time window (defaulting to the last 30 days) in hours and minutes. | System |
| **FR-22** | The system shall restrict Actions Taken creation, Parent-Child linking, and Operational Dashboard access strictly to `IT_STAFF` and `ADMINISTRATOR` roles, returning `403 Forbidden` for Requesters. | System |

---

## 5. Business Rules

| BR ID | Business Rule Statement | Category |
|---|---|---|
| **BR-01** | **Hierarchy Depth Limitation:** Parent-child ticket relationships are strictly single-tier (depth = 1). A ticket that is currently a child ticket cannot have child tickets linked to it. A ticket that is currently a parent ticket cannot be linked as a child to another ticket. | Parent-Child |
| **BR-02** | **Cycle and Self-Link Prevention:** A ticket cannot be linked as a parent or child to itself. Any request attempting self-linking or circular parentage must be rejected with `400 Bad Request`. | Parent-Child |
| **BR-03** | **Unlinking Independence:** Unlinking a child ticket from a parent clears the `parentId` foreign key on the child. Unlinking does not alter the status, owner, priority, or comments of either ticket. | Parent-Child |
| **BR-04** | **Parent Deletion / Cancellation Protection:** If a parent ticket is cancelled, child tickets remain active and retain their individual status, but their parent reference displays a visual indicator that the parent is cancelled. Deletion of tickets is prohibited. | Parent-Child |
| **BR-05** | **Action Performer Autonomy:** The `performer` of an Action Taken is always the authenticated user making the API request. Any active user with role `IT_STAFF` or `ADMINISTRATOR` may record an action on any ticket, regardless of whether the ticket is unassigned or assigned to someone else. | Ownership & Actions |
| **BR-06** | **Owner Preservation:** Logging an Action Taken on a ticket owned by another staff member DOES NOT automatically reassign ticket ownership. The `ownerId` remains unchanged unless an explicit reassignment or claim is requested. | Ownership & Actions |
| **BR-07** | **Actions Taken Immutability:** Actions Taken records are append-only audit entries. Once submitted, an Action Taken cannot be edited, modified, or deleted by any user. | Audit & Integrity |
| **BR-08** | **Actions Taken Validation:** The Action Taken `summary` must be between 3 and 150 characters. `details` must be between 10 and 2,000 characters. `timeSpentMinutes` must be a non-negative integer ($\ge 0$ and $\le 1,440$ minutes / 24 hours). Empty or whitespace-only inputs must be rejected with `400 Bad Request`. | Validation |
| **BR-09** | **Role Restriction on Actions Taken:** Requesters are strictly prohibited from logging Actions Taken. API requests from Requesters must return `403 Forbidden`. | Authorization |
| **BR-10** | **Updated Status Transition Matrix:** Permitted transitions for Lab 4: <br>- `NEW` $\rightarrow$ `OPEN`, `IN_PROGRESS`, `CANCELLED`<br>- `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED` *(Gate Required)*, `CANCELLED`<br>- `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`<br>- `REOPENED` $\rightarrow$ `IN_PROGRESS`, `RESOLVED` *(Gate Required)*<br>- `CLOSED` and `CANCELLED` are terminal states. Invalid transitions return `400 Bad Request`. | Status Workflow |
| **BR-11** | **Resolution Gate - Action Taken Prerequisite:** A ticket CANNOT transition to `RESOLVED` or `CLOSED` unless at least one valid `ActionTaken` record exists associated with the ticket. | Resolution Gate |
| **BR-12** | **Resolution Gate - Resolution Summary Prerequisite:** Transitioning to `RESOLVED` requires a non-empty `resolutionSummary` string of at least 10 characters and at most 2,000 characters, explaining the root cause or remediation. | Resolution Gate |
| **BR-13** | **Resolution Gate - Child Ticket Completion Prerequisite:** A parent ticket CANNOT transition to `RESOLVED` or `CLOSED` if any of its linked child tickets are in an active, unresolved status (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`). All child tickets must be in `RESOLVED`, `CLOSED`, or `CANCELLED`. | Resolution Gate |
| **BR-14** | **Resolution Gate Error Code & Diagnostics:** If a status transition to `RESOLVED` fails any Resolution Gate check, the server must return `422 Unprocessable Entity` with an error details array explicitly identifying which preconditions failed: `MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`, and/or `UNRESOLVED_CHILD_TICKETS` (including the list of blocking child ticket numbers). | API & Errors |
| **BR-15** | **Resolution Timestamps:** Transitioning to `RESOLVED` automatically sets `resolvedAt = NOW()`. Transitioning to `CLOSED` sets `closedAt = NOW()`. If a ticket is transitioned to `REOPENED`, `resolvedAt` and `closedAt` are reset to `null`. | Data Lifecycle |
| **BR-16** | **Requester Problem Appears Resolved Interaction:** When a Requester triggers "Problem Appears Resolved", the ticket moves to `WAITING_FOR_REQUESTER` or a pending review flag, but NOT directly to `RESOLVED`. Formal resolution still requires IT Staff to satisfy the Resolution Gate. | Workflow |
| **BR-17** | **Dashboard KPI - Total Open Tickets:** Count of all tickets where `currentStatus` is one of `['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']`. | Dashboard |
| **BR-18** | **Dashboard KPI - Unassigned Tickets:** Count of all active (open) tickets where `ownerId IS NULL`. | Dashboard |
| **BR-19** | **Dashboard KPI - Waiting for Requester:** Count of all active tickets where `currentStatus = 'WAITING_FOR_REQUESTER'`. | Dashboard |
| **BR-20** | **Dashboard KPI - Urgent / High Open Tickets:** Count of all active tickets where `itPriority` is either `URGENT` or `HIGH`. | Dashboard |
| **BR-21** | **Dashboard KPI - Resolved Today:** Count of tickets where `resolvedAt` falls between 00:00:00.000 and 23:59:59.999 of the current date in the system's local/server time zone. | Dashboard |
| **BR-22** | **Dashboard KPI - Average Resolution Time Calculation:** Calculated as: $\frac{\sum (\text{resolvedAt} - \text{createdAt})}{N}$ in minutes for all tickets resolved within the reporting window (default: last 30 days). If $N = 0$, the metric returns `0` minutes (safe zero division). Displayed formatted in hours and minutes (e.g. `4h 15m` or `45m`). | Dashboard |
| **BR-23** | **Dashboard Drill-Down URL Mapping:** Clicking a metric card must map to deterministic query parameters on `/staff/tickets`: <br>- *Total Open:* `?status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED`<br>- *Unassigned:* `?ownership=unassigned&status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED`<br>- *Waiting for Requester:* `?status=WAITING_FOR_REQUESTER`<br>- *Urgent / High:* `?priority=URGENT,HIGH&status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED`<br>- *Resolved Today:* `?status=RESOLVED&resolvedRange=today` | Drill-Down |
| **BR-24** | **Backward Compatibility & Regression Invariance:** All Lab 2 self-service ticket/attachment features and Lab 3 RBAC, password security, comments, notes, and user administration features must remain 100% operational without regression. | Regression |

---

## 6. UI Specification Summary

The Lab 4 UI enhances the Zen Green design system with dedicated operational controls and analytics visualizations:

1. **Staff Operations Dashboard (`/staff/dashboard`):**
   - High-impact KPI grid featuring 6 Zen Green metric cards (Total Open, Unassigned, Waiting for Requester, Urgent/High Open, Resolved Today, Avg Resolution Time).
   - Visual card design: White card backing with 1px border (`#D8E0DC`), distinctive 4px left-border accent corresponding to status/priority, large numeric display (`2.25rem`, bold, Zen Green `#006B3C`), contextual trend/label subtitle, and interactive hover elevation (`translateY(-2px)` with shadow).
   - Ticket Distribution Widgets: Clean horizontal stacked distribution bars and donut/breakdown charts displaying tickets by Status, IT Priority, and Category.
   - Interactive drill-down: Clicking any card or breakdown bar routes directly to the Ticket Queue with relevant filters pre-applied.
2. **Actions Taken Activity Feed (`/staff/tickets/:id`):**
   - Positioned alongside Public Comments and Internal Notes on the Ticket Detail screen as a dedicated tab or prominent section.
   - Displays a chronological vertical timeline of action cards. Each card highlights the Action Type badge (e.g., `[DIAGNOSIS]`, `[WORKAROUND]`), performer name and role badge, timestamp, duration pill (`⏱️ 45m`), summary, and detailed action notes.
   - "+ Log Action Taken" primary button opens a Zen Green modal dialog with field validation (Type dropdown, Summary input, Details textarea, Duration number input).
3. **Parent-Child Ticket Hierarchy Widget (`/staff/tickets/:id`):**
   - Dedicated "Linked Child Tickets" panel on the parent ticket showing a tabular list of children with Ticket Number, Summary, Priority, Status badge, Owner, and "Unlink" action button.
   - "+ Link Child Ticket" modal dialog with search-and-select autocomplete to link existing open tickets.
   - Visual Parent Banner on child tickets: A prominent Zen Green callout at the top of the detail screen indicating `📌 Child of TCK-2026-0042: Network switch failure in Bldg A`, with a direct link to the parent.
4. **Resolution Gate Modal / Workflow (`/staff/tickets/:id`):**
   - Selecting `RESOLVED` in the status dropdown triggers the Resolution Gate verification modal.
   - Real-time precondition checklist:
     - `✓ At least 1 Action Taken recorded` (or red warning with link to log an action).
     - `✓ Resolution Summary provided` (textarea with live character count).
     - `✓ All child tickets resolved (0 open child tickets)` (or red warning listing open child tickets).
   - "Confirm Resolution" button is disabled until all gate criteria are satisfied.

*(For detailed visual styling, responsive layouts, color tokens, and interactive mockups, refer to `docs/lab-04/ui-spec.md`.)*

---

## 7. Database Evolution and Migration Strategy

### Prisma Schema Models & Extensions

```prisma
enum ActionType {
  DIAGNOSIS
  INVESTIGATION
  WORKAROUND
  VENDOR_ESCALATION
  HARDWARE_REPAIR
  SOFTWARE_PATCH
  COMMUNICATION
  RESOLUTION_STEP
  OTHER
}

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
  
  // Lab 4: Parent-Child Self-Relation
  parentId          String?
  parent            Ticket?           @relation("ParentChild", fields: [parentId], references: [id], onDelete: SetNull)
  children          Ticket[]          @relation("ParentChild")
  
  // Lab 4: Resolution Gate Metadata
  resolvedAt        DateTime?
  closedAt          DateTime?
  resolutionSummary String?           @db.Text
  
  // Existing Relations
  attachments       Attachment[]
  publicComments    PublicComment[]
  internalNotes     InternalNote[]
  
  // Lab 4: Actions Taken Relation
  actionsTaken      ActionTaken[]
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([requesterId])
  @@index([ownerId])
  @@index([parentId])
  @@index([currentStatus])
  @@index([itPriority])
  @@index([resolvedAt])
  @@map("tickets")
}

// Lab 4: New ActionTaken Model
model ActionTaken {
  id               String     @id @default(cuid())
  ticketId         String
  ticket           Ticket     @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performerId      String
  performer        User       @relation(fields: [performerId], references: [id])
  actionType       ActionType @default(INVESTIGATION)
  summary          String
  details          String     @db.Text
  timeSpentMinutes Int        @default(0)
  createdAt        DateTime   @default(now())

  @@index([ticketId])
  @@index([performerId])
  @@index([actionType])
  @@index([createdAt])
  @@map("actions_taken")
}

// Model Extension: User relation update
// (User model adds: actionsTaken ActionTaken[])
```

### Architectural Design Choice Justifications

#### Design Choice 1: Self-Referential 1-to-Many Relationship for Parent-Child Tickets
- **Alternative Considered:** A separate many-to-many junction table (`TicketLink` or `ProblemIncidentAssociation`) allowing any ticket to link to multiple parents and multiple children.
- **Justification for Chosen Design:**
  1. *Operational Simplicity and Alignment with ITIL Standards:* In standard service desk workflows, subordinate incident tickets roll up to a single master parent ticket (e.g., multiple user reports of email failure linked to a single major outage incident). A 1-to-many relationship (`parentId` foreign key on the child `Ticket`) models this exact operational paradigm cleanly without unnecessary relational overhead.
  2. *Strict Hierarchy Enforcement and Cycle Prevention:* Enforcing a single-tier hierarchy (depth = 1) is mathematically trivial with a self-referential `parentId`: a ticket cannot be a parent if its `parentId` is not null, and cannot be a child if its `children.length > 0`. A junction table would require complex recursive graph queries and cycle detection locks on every transaction, adding latency and vulnerability to race conditions.
  3. *Indexing and Query Performance:* The `parentId` column on `Ticket` can be directly indexed, enabling immediate single-query joins (`SELECT * FROM tickets WHERE parentId = :id`) when rendering the parent ticket, and zero extra join tables when verifying child statuses during Resolution Gate execution.

#### Design Choice 2: Dedicated Normalized `ActionTaken` Model vs. Overloading `InternalNote`
- **Alternative Considered:** Adding an `isAction` boolean flag and nullable JSON metadata column to the existing `InternalNote` table.
- **Justification for Chosen Design:**
  1. *Distinct Operational Semantics & Domain Separation:* Internal Notes are unstructured conversational chatter, handover notes, or preliminary thoughts between engineers. Actions Taken are formalized, auditable technical interventions that directly represent engineering effort and remediation history.
  2. *Schema-Level Type Safety & Structured Aggregations:* The `ActionTaken` model requires specific structured attributes: an enumerated `ActionType`, dedicated `timeSpentMinutes`, concise `summary`, and `details`. Housing these in a normalized schema enables direct, high-performance database indexing and analytical aggregations (`SUM(timeSpentMinutes)` grouped by `actionType` or `performerId`) without fragile JSON parsing or string splitting.
  3. *Resolution Gate Integrity:* The Resolution Gate requires an unambiguous, reliable existence check (`ticket.actionsTaken.length > 0`). Storing actions in a dedicated table guarantees that informal notes cannot be accidentally mistaken for concrete remediation actions.

### Database Migration Strategy
1. **Migration Safety:** The migration (`20261028_lab4_actions_parent_child_dashboard`) is purely additive:
   - Creates enum `ActionType`.
   - Creates table `actions_taken` with foreign keys to `tickets` and `users`.
   - Adds nullable columns `parentId`, `resolvedAt`, `closedAt`, and `resolutionSummary` to `tickets`.
   - Existing records require zero data mutation or downtime.
2. **Idempotent Seed Evolution:**
   - Seed script adds realistic parent-child relationships (e.g., Parent major network outage ticket with 3 linked child requester tickets).
   - Seed script populates historical `ActionTaken` records across multiple staff members demonstrating varied `actionType` values and duration tracking.
   - Seed script populates sample resolved tickets with valid `resolvedAt` and `resolutionSummary` to populate initial operational dashboard metrics.

---

## 8. API Contract Summary

| Method | Endpoint Path | Permitted Roles | Description | Success Code |
|---|---|---|---|---|
| `GET` | `/api/tickets/:id/actions` | IT Staff, Admin | Retrieve chronological list of Actions Taken on a ticket | `200 OK` |
| `POST` | `/api/tickets/:id/actions` | IT Staff, Admin | Log a new Action Taken on a ticket (captures performer identity) | `201 Created` |
| `GET` | `/api/tickets/:id/children` | IT Staff, Admin | Retrieve all linked child tickets for a parent ticket | `200 OK` |
| `POST` | `/api/tickets/:id/children` | IT Staff, Admin | Link an existing ticket as a child of this ticket | `200 OK` |
| `DELETE` | `/api/tickets/:id/children/:childId` | IT Staff, Admin | Unlink a child ticket from its parent | `200 OK` |
| `PATCH` | `/api/tickets/:id/status` | IT Staff, Admin, Requester | Update ticket status; enforces Resolution Gate if target is `RESOLVED` | `200 OK` |
| `GET` | `/api/dashboard/metrics` | IT Staff, Admin | Retrieve KPI metric card stats (open, unassigned, waiting, urgent, etc.) | `200 OK` |
| `GET` | `/api/dashboard/breakdown` | IT Staff, Admin | Retrieve ticket distributions grouped by status, priority, and category | `200 OK` |

*(For complete request/response schemas, JSON payloads, and error codes, refer to `docs/lab-04/api-spec.md`.)*

---

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion Statement |
|---|---|
| **AC-01** | Given an authenticated IT Staff or Admin user, when submitting a valid Action Taken (`POST /api/tickets/:id/actions`), then the action is persisted with the authenticated user recorded as `performer` and returned with HTTP `201 Created`. |
| **AC-02** | Given a ticket owned by Staff Member A, when Staff Member B submits an Action Taken, then the action is successfully created with Staff Member B as `performer`, and the ticket's `ownerId` remains Staff Member A. |
| **AC-03** | Given an unassigned ticket, when an IT Staff member logs an Action Taken with `claimTicket: true`, then the action is created and ticket ownership is immediately assigned to that staff member. |
| **AC-04** | Given an authenticated Requester, when attempting to call any Actions Taken endpoint (`GET/POST /api/tickets/:id/actions`), then the request is rejected with `403 Forbidden`. |
| **AC-05** | Given an IT Staff user, when viewing a ticket with logged actions, then the Actions Taken feed renders all actions in chronological order with type badges, performer info, duration, summary, and details. |
| **AC-06** | Given an IT Staff user, when linking an existing open ticket as a child (`POST /api/tickets/:id/children`), then the child ticket's `parentId` is updated, and the child appears in the parent's Child Tickets list. |
| **AC-07** | Given an attempt to link a ticket as a child to itself or to a ticket that is already a child, then the API rejects the request with `400 Bad Request` or `409 Conflict`. |
| **AC-08** | Given an IT Staff user viewing a child ticket, then a prominent parent banner is displayed with the parent ticket number, summary, and a working navigation link. |
| **AC-09** | Given an IT Staff user, when unlinking a child ticket (`DELETE /api/tickets/:id/children/:childId`), then the child's `parentId` is set to null without affecting any other ticket fields. |
| **AC-10** | Given a ticket with zero recorded Actions Taken, when an IT Staff user attempts to transition the status to `RESOLVED`, then the request is rejected with `422 Unprocessable Entity` and error code `MISSING_ACTION_TAKEN`. |
| **AC-11** | Given a ticket with actions recorded but missing a `resolutionSummary` ($\ge 10$ chars), when transitioning to `RESOLVED`, then the request is rejected with `422 Unprocessable Entity` and error code `MISSING_RESOLUTION_SUMMARY`. |
| **AC-12** | Given a parent ticket having one or more child tickets in `OPEN` or `IN_PROGRESS` status, when attempting to resolve the parent, then the request is rejected with `422 Unprocessable Entity` and error code `UNRESOLVED_CHILD_TICKETS`. |
| **AC-13** | Given a ticket that satisfies all Resolution Gate criteria (has actions, resolution summary provided, and zero open children), when transitioning to `RESOLVED`, then the status updates to `RESOLVED`, `resolvedAt` is stamped, and HTTP `200 OK` is returned. |
| **AC-14** | Given an IT Staff or Admin user accessing `/staff/dashboard`, then the system renders 6 KPI metric cards displaying accurate counts and average resolution time calculated per business rules. |
| **AC-15** | Given an IT Staff user viewing the dashboard, when clicking any KPI metric card, then the application navigates to `/staff/tickets` with the corresponding status, priority, or ownership filters pre-applied. |
| **AC-16** | Given an active system state with zero resolved tickets in the reporting period, when the dashboard metrics API is requested, then `avgResolutionMinutes` returns `0` without throwing a division-by-zero error. |
| **AC-17** | Given responsive viewports (Desktop $\ge 992\text{px}$, Tablet $768-991\text{px}$, Mobile $< 768\text{px}$), when viewing the dashboard and ticket detail actions feed, components adapt gracefully without horizontal scroll. |
| **AC-18** | Given existing Lab 2 and Lab 3 tickets, users, public comments, internal notes, and attachments, all existing functionality continues to work without data loss or regressions. |

---

## 10. Definition of Done

### Product Completion Checklist
- [ ] Complete implementation of all approved Lab 4 scope (Actions Taken sub-workflow, ownership vs performer decoupling, parent-child ticket linking, resolution gate enforcement, operational dashboards, metric drill-downs).
- [ ] Satisfaction of all Acceptance Criteria (`AC-01` through `AC-18`).
- [ ] Passing automated tests across all required levels (Unit, API, UI Component, UI Style, Responsive, E2E).
- [ ] Server-side enforcement of RBAC authorization (`401`/`403`) and Resolution Gate business rules (`422`).
- [ ] Full compliance with Zen Green design tokens, metric card specifications, and mobile responsiveness.
- [ ] Verified additive database schema migration and idempotent seed scripts.
- [ ] Zero regression across Lab 1, Lab 2, and Lab 3 capabilities.
- [ ] Zero skipped, commented out, or disabled test cases.

### Course Delivery Requirements Checklist
- [ ] Feature branch workflow using `feature/22-lab4-specification` (or sprint designated branch) for contract documentation.
- [ ] Staged integration through `lab4-staging` before merging to `main`.
- [ ] Peer code review and approval documented in `docs/lab-04/reviewer.md`.
- [ ] AI prompt usage and reflection recorded in `docs/lab-04/ai-use.md`.
- [ ] Final submission PDF assembled with all required answer parts.

---

## 11. Assumptions and Decisions

| Decision ID | Choice / Decision | Technical Justification / Context |
|---|---|---|
| **DEC-01** | Self-Referential Parent-Child Relation | Prevents multi-tier complexity; enables simple cycle detection; maps directly to ITIL master incident / sub-ticket models. |
| **DEC-02** | Dedicated `ActionTaken` Database Model | Normalized entity ensures strict typing, dedicated duration tracking, efficient aggregation, and separation from informal internal notes. |
| **DEC-03** | Server-Side Resolution Gate Enforcement | Enforced strictly in backend controllers/services to ensure API integrity regardless of client frontend bypass attempts. |
| **DEC-04** | HTTP 422 Unprocessable Entity for Gate Failures | Differentiates business rule validation failures (Resolution Gate unsatisfied) from standard syntax/type errors (`400 Bad Request`). |
| **DEC-05** | URL-Driven Metric Drill-Down | Dashboard metric cards link to `/staff/tickets` via standard URL query parameters, preserving browser bookmarking and back-button navigation. |
| **DEC-06** | Append-Only Actions Audit Log | Prohibiting editing or deletion of Actions Taken guarantees an immutable operational audit trail for compliance and post-incident analysis. |
