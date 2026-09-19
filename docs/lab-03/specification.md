# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
The goal of Lab 3 is to deliver a secure, role-based IT support management increment for TokTickIT. This sprint replaces the temporary Lab 2 Development Requester selector with real email/password authentication and mandatory first-login password changes, introduces role-based access control (RBAC) across three distinct roles (Requester, IT Staff, Administrator), implements an operational IT Staff Ticket Queue and Detail workflow (claiming/reassigning tickets, setting IT Priority, managing permitted status transitions, posting Public Comments, and creating private Internal Notes), and adds a minimalist Administrator User Management interface (user creation, account editing, one-role assignment, activation/deactivation, initial password resets), while maintaining 100% backward compatibility for all Lab 2 Requester ticket and attachment functions.

## 2. Stakeholder Request Interpretation
Stakeholders require TokTickIT to transition from a development testing prototype into an operational multi-role system. Authentication must replace the temporary requester selector, requiring users to log in securely with email and password, and forcing accounts with initial passwords to change them immediately before accessing application features. 

Requesters must retain full access to submit and manage their own tickets, post public comments, and indicate when a problem appears resolved. IT Staff need a centralized Ticket Queue to discover, claim, prioritize, update, and manage tickets through a controlled status workflow, communicating publicly with Requesters via Public Comments and privately within the staff team via Internal Notes. Administrators require a minimalist User Management interface to create accounts, modify user details, assign one permitted role per user, manage account activation states, and reset initial passwords without bloat or unnecessary complexity. 

All API endpoints and UI screens must enforce strict server-side role and ownership authorization, ensuring hidden buttons are never relied upon as a security control, while adhering to the Zen Green design system established in Lab 2.

## 3. Scope

### Included
- **Authentication & Password Management:** Secure email/password login, session/token management, logout session invalidation, current user context retrieval (`GET /api/auth/me`), and mandatory first-login password change workflow.
- **Role-Based Authorization:** Server-side role enforcement for `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR` roles, combined with resource ownership checks for Requesters.
- **Data Model Migration:** Evolving the Lab 2 `RequesterUser` and `Ticket` schema into a unified `User` model, adding Ticket Owner, IT Priority, Public Comments, Internal Notes, and updated Ticket Statuses without breaking existing ticket or attachment data.
- **Requester Regression & Public Collaboration:** Authenticated Requester access to ticket creation, ticket listing, detail view, attachment management, posting Public Comments, and indicating problem resolution ("Problem Appears Resolved").
- **IT Staff Ticket Operations:** Shared Ticket Queue with search, filtering (Status, Priority, Ownership), sorting, and pagination; Ticket Detail with ownership claiming/reassigning, IT Priority modification, permitted status workflow transitions, Public Comments, and role-restricted Internal Notes.
- **Minimalist Administrator User Management:** Single User Management screen providing user listing, search by name/email, role filtering, user creation with initial password, user editing (name, email, role, active status), and initial password resets.
- **Zen Green UI Extensions:** Application header with authenticated user profile badge, logout control, role-based navigation, responsive tables and cards, consistent status/priority badges, and feedback for busy, error, empty, no-results, forbidden, and success states.

### Excluded
- Email invitations, password-reset emails, multi-factor authentication (MFA), social login, and single sign-on (SSO).
- User self-registration and Requester-created accounts (all accounts are created by Administrators).
- "Actions Taken" sub-workflow by IT Staff (deferred to Lab 4).
- Formal SLA calculations, automated escalation rules, and notification services.
- Dashboards and KPI analytics beyond simple ticket queue counts.
- Multi-tenant organizations, departments, customer administration, and extended profile management (profile photos, org charts).
- Multiple roles assigned to a single user (each user has exactly one assigned role).
- User deletion, bulk user operations, user import/export, and account audit history screens.
- Account unlocking workflows, administrator approval queues, and advanced identity management.
- Advanced user-list features such as mandatory pagination for admin user list, multi-column sorting, or multiple simultaneous search filters on users.

---

## 4. Functional Requirements

| FR ID | Functional Requirement Statement | Target Role |
|---|---|---|
| **FR-01** | The system shall provide an authentication interface allowing users to log in using valid email and password credentials. | All |
| **FR-02** | The system shall enforce a mandatory password change screen upon successful login for any user marked with `mustChangePassword = true`, blocking access to all application screens until a valid new password is saved. | All |
| **FR-03** | The system shall provide a logout capability that invalidates the active authenticated session/token and redirects the user to the login screen. | All |
| **FR-04** | The system shall provide an endpoint (`GET /api/auth/me`) returning the identity, role, and mandatory password change status of the currently authenticated user. | All |
| **FR-05** | The system shall remove the temporary Lab 2 Development Requester selector and derive user identity exclusively from the authenticated session. | All |
| **FR-06** | The system shall enforce server-side role-based authorization on every protected API endpoint, returning `401 Unauthorized` for unauthenticated requests and `403 Forbidden` for unauthorized roles. | System |
| **FR-07** | The system shall enforce Requester ownership protection on all Lab 2 ticket and attachment operations, scoping data access strictly to the authenticated Requester identity. | Requester |
| **FR-08** | The system shall allow an authenticated Requester to create IT tickets, view owned tickets in My Tickets, view owned Ticket Details, upload/download permitted attachments, and soft-remove attachments. | Requester |
| **FR-09** | The system shall allow a Requester to post Public Comments on tickets they own and view all Public Comments on their tickets. | Requester |
| **FR-10** | The system shall allow a Requester to trigger a "Problem Appears Resolved" action on an active owned ticket, updating the ticket status to request formal resolution verification by IT Staff. | Requester |
| **FR-11** | The system shall provide IT Staff and Administrators with access to a shared IT Staff Ticket Queue displaying all submitted tickets across all Requesters. | IT Staff, Admin |
| **FR-12** | The system shall support searching tickets in the IT Staff Queue by keyword matching ticket number, summary, or description. | IT Staff, Admin |
| **FR-13** | The system shall support filtering the IT Staff Queue by Category, Status, IT Priority, and Ownership (Unassigned, Assigned to Me, All). | IT Staff, Admin |
| **FR-14** | The system shall support sorting and paginating the IT Staff Ticket Queue with configurable page size and sort direction. | IT Staff, Admin |
| **FR-15** | The system shall allow IT Staff or Administrators to view full Ticket Details for any ticket in the system. | IT Staff, Admin |
| **FR-16** | The system shall allow IT Staff or Administrators to claim unassigned ticket ownership or reassign ticket ownership to another active IT Staff/Admin user. | IT Staff, Admin |
| **FR-17** | The system shall allow IT Staff or Administrators to modify the IT Priority field (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) of a ticket. | IT Staff, Admin |
| **FR-18** | The system shall enforce permitted ticket status transitions and allow IT Staff or Administrators to update ticket status accordingly. | IT Staff, Admin |
| **FR-19** | The system shall allow IT Staff and Administrators to post Public Comments on any ticket. | IT Staff, Admin |
| **FR-20** | The system shall allow IT Staff and Administrators to create and view private Internal Notes on any ticket, while completely blocking Requester access to Internal Notes. | IT Staff, Admin |
| **FR-21** | The system shall provide an Administrator User Management interface displaying a list of all user accounts with Name, Email, Role, and Active Status. | Administrator |
| **FR-22** | The system shall allow an Administrator to search users by name or email and filter users by role. | Administrator |
| **FR-23** | The system shall allow an Administrator to create a new user account with Name, Email, one permitted Role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), Active status, and an initial password. | Administrator |
| **FR-24** | The system shall allow an Administrator to update a user's Name, Email, Role, and Active/Inactive status. | Administrator |
| **FR-25** | The system shall allow an Administrator to set a new initial password for any user account, automatically marking `mustChangePassword = true` for that account. | Administrator |

---

## 5. Business Rules

| BR ID | Business Rule Statement | Category |
|---|---|---|
| **BR-01** | Only an active user account with valid email and password credentials may authenticate successfully. Inactive accounts attempting login must be rejected. | Authentication |
| **BR-02** | A user marked as requiring a password change (`mustChangePassword = true`) cannot access normal application routes or operational APIs until a valid new password is saved. | Authentication |
| **BR-03** | Authenticated user identity established by session/token, not any client-supplied `requesterId` parameter or header, determines ownership of Requester operations. | Authorization |
| **BR-04** | Public Comments are visible to the Requester (owner), IT Staff, and Administrator. Internal Notes are visible ONLY to IT Staff and Administrator and must never be exposed to Requesters. | Security |
| **BR-05** | A Requester may indicate that a problem appears resolved (updating status to `WAITING_FOR_REQUESTER` or requesting review), but CANNOT formally set a ticket status to `RESOLVED` or `CLOSED`. Formal resolution is reserved for IT Staff and Administrators. | Workflow |
| **BR-06** | Initial passwords set by Administrators (during user creation or password reset) automatically set `mustChangePassword = true` on the target account. Voluntary password changes set `mustChangePassword = false`. | Passwords |
| **BR-07** | Passwords must satisfy minimum security complexity: at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one numeric digit, and one special character. | Passwords |
| **BR-08** | Login attempts with invalid credentials or for inactive accounts must return generic, safe error feedback (`401 Unauthorized` with message "Invalid email or password") without exposing account existence or status. | Security |
| **BR-09** | Each user account is assigned exactly one permitted role (`REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`). Multi-role assignment is strictly prohibited in Lab 3. | User Management |
| **BR-10** | Requester ownership scoping: Requester API calls for tickets or attachments not owned by the authenticated Requester must return `403 Forbidden` or `404 Not Found` without exposing metadata. | Authorization |
| **BR-11** | Ticket Ownership: A ticket may be initially unassigned (`ownerId = null`). Only active IT Staff or Administrator users may be assigned as Ticket Owner. Claiming a ticket sets `ownerId` to the current user. | IT Staff |
| **BR-12** | Requested Priority vs. IT Priority: `requestedPriority` is submitted by the Requester upon creation and remains immutable. `itPriority` is initialized to match `requestedPriority` upon creation and may subsequently be modified only by IT Staff or Administrators. | IT Staff |
| **BR-13** | Valid Ticket Statuses are `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`. | Workflow |
| **BR-14** | Permitted Status Transition Rules: <br>- `NEW` → `OPEN`, `IN_PROGRESS`, `CANCELLED`<br>- `OPEN` → `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>- `IN_PROGRESS` → `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>- `WAITING_FOR_REQUESTER` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`<br>- `RESOLVED` → `CLOSED`, `REOPENED`<br>- `REOPENED` → `IN_PROGRESS`, `RESOLVED`<br>- `CLOSED` and `CANCELLED` are terminal states (reopening from `CLOSED` requires explicit Admin override if configured; default closed tickets are immutable). Invalid transitions must be rejected with `400 Bad Request`. | Workflow |
| **BR-15** | Public Comments and Internal Notes are append-only. Editing, updating, or deleting existing comments or notes is excluded. Author identity and creation timestamp are recorded automatically by the backend. | Comments & Notes |
| **BR-16** | Comment and Note validation: Empty or whitespace-only content is rejected. Content length must be between 1 and 2,000 characters. HTML tags must be sanitized or safely rendered as plain text. | Validation |
| **BR-17** | Self-Deactivation Protection: An Administrator is strictly prohibited from deactivating their own currently logged-in account. | Safety Rules |
| **BR-18** | Last Active Administrator Protection: The system must block any operation (editing role or active status) that would leave the system with zero active Administrator accounts. | Safety Rules |
| **BR-19** | Email Uniqueness: User email addresses must be unique across all accounts in the database (case-insensitive). Attempts to create or update a user with a duplicate email must return `409 Conflict`. | User Management |
| **BR-20** | User Account Deactivation: User deletion is prohibited. Disabling access must be performed by setting `isActive = false`. Inactive users cannot log in, and existing sessions for deactivated users are terminated. | User Management |
| **BR-21** | IT Staff Ticket Queue defaults: Search queries match ticket number, summary, and description. Default ordering is by creation date descending (`createdAt DESC`). Default page size is 10 items. | IT Staff Queue |
| **BR-22** | Removal of Development Requester Selector: The temporary selector UI, client storage key (`toktickit.requesterId`), and header (`X-Requester-Id`) are completely removed. Authentication headers/cookies replace them. | Architecture |
| **BR-23** | Safe Error Masking: Server responses must not reveal sensitive internal information, stack traces, or whether protected resources owned by another user exist. | Security |
| **BR-24** | Seed Data Idempotency: Database seed scripts must execute safely and repeatedly without creating duplicate records or resetting production modifications. | Data |
| **BR-25** | Attachment Continuity: All Lab 2 attachment constraints (allowed types JPG, PNG, WEBP, PDF; max 5 MB per file; max 5 active attachments per ticket; soft-removal with reason) remain in full effect for Lab 3. | Attachments |

---

## 6. UI Specification Summary

The Lab 3 interface extends the **Zen Green** design language across all new and updated screens, maintaining visual consistency, accessibility, and responsiveness.

- **App Shell & Header Navigation:** Replaces the Development Requester indicator with an authenticated user widget displaying the user's full name and role badge (`Requester`, `IT Staff`, `Administrator`). Includes a user profile menu with "Change Password" and "Logout" actions. Navigation links dynamically adapt based on user role:
  - *Requester:* "My Tickets", "Create Ticket"
  - *IT Staff:* "Ticket Queue", "Create Ticket"
  - *Administrator:* "User Management"
- **Login Screen (`/login`):** Zen Green card centered on page with email and password inputs, primary submit button, inline field validation error placement, loading busy state, and safe error banner for invalid credentials or inactive accounts.
- **Mandatory Password Change Screen (`/change-password`):** Modal/overlay layout presented immediately after login when `mustChangePassword = true`. Displays password complexity criteria checklist, current/temporary password input, new password input, confirmation password input, and submit button. Access to other screens is blocked until completed.
- **IT Staff Ticket Queue (`/staff/tickets`):** Professional operational workbench featuring a top control toolbar with search input, Category filter, Status filter, IT Priority filter, Ownership filter ("All", "Unassigned", "Assigned to Me"), Sort dropdown, and "Clear Filters" button. Displays a desktop data table (>=992px) and stacked card list on mobile (<768px) with status badges, priority indicators, ticket owner column, and "View Detail" action. Includes pagination bar at bottom.
- **IT Staff Ticket Detail (`/staff/tickets/:id`):** Dual-column layout presenting ticket summary/description, metadata, owner assignment control (Claim / Reassign dropdown), IT Priority modifier, and status transition control bar. Features visually distinct tabbed/stacked sections for **Public Comments** (green tint accent, visible to all) and **Internal Notes** (amber/yellow accent with explicit "IT Staff & Admin Only" lock badge). Includes attachments list and upload controls.
- **Requester Ticket Detail (`/tickets/:id`):** Retains Lab 2 layout while adding the Public Comments section (post comment & view comment thread) and an explicit "Problem Appears Resolved" primary action button when status is active. Internal Notes section is completely absent.
- **Administrator User Management (`/admin/users`):** Clean, minimalist admin interface featuring a header with "Create User" primary button, search bar (name/email), role filter dropdown, and user table displaying Name, Email, Role badge, Status badge (Active/Inactive), and Action buttons ("Edit", "Reset Password"). Modal dialogs handle User Creation, User Editing, and Initial Password Reset with real-time validation and safety rule enforcement.

*(For complete UI component rules, color tokens, visual states, and responsive breakpoints, refer to `docs/lab-03/ui-spec.md`.)*

---

## 7. Data Changes

### Prisma Schema Models & Extensions

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

enum RequestedPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ITPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

model User {
  id                 String          @id @default(cuid())
  name               String
  email              String          @unique
  passwordHash       String
  role               Role            @default(REQUESTER)
  isActive           Boolean         @default(true)
  mustChangePassword Boolean         @default(true)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  // Relationships
  requestedTickets   Ticket[]        @relation("TicketRequester")
  ownedTickets       Ticket[]        @relation("TicketOwner")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@map("users")
}

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
  
  attachments       Attachment[]
  publicComments    PublicComment[]
  internalNotes     InternalNote[]
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([requesterId])
  @@index([ownerId])
  @@index([currentStatus])
  @@index([itPriority])
  @@map("tickets")
}

model PublicComment {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([ticketId])
  @@map("public_comments")
}

model InternalNote {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([ticketId])
  @@map("internal_notes")
}
```

### Lab 2 Migration Decisions
1. **Model Evolution:** Existing `RequesterUser` records are migrated into the `User` model with `role = REQUESTER`, `isActive = true`, and `mustChangePassword = false` (or assigned a default hashed initial password `$2b$10$...`).
2. **Ticket Foreign Keys:** `Ticket.requesterId` foreign key is re-linked from `RequesterUser` to `User`. Existing tickets preserve their original Requester ownership.
3. **New Fields Initialization:** Existing tickets receive `itPriority` initialized to match their `requestedPriority`, `ownerId = null`, and `currentStatus` mapped to `TicketStatus.NEW` (or corresponding status).
4. **Cleanup:** Temporary selector endpoints and mock requester configurations are removed.

### Idempotent Seed Data Requirements
- **Requesters:** At least 4 active Requesters (`Jennifer Anderson`, `Michael Brown`, `David Lee`, `Sarah Johnson`) and 1 inactive Requester (`Inactive User Test`).
- **IT Staff:** At least 3 active IT Staff (`Alex Thompson`, `Lisa Martinez`, `Kevin Patel`) and 1 inactive IT Staff (`Inactive Staff Test`).
- **Administrators:** At least 1 active Administrator (`Admin User`).
- **Tickets:** Seeded tickets distributed across statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`), priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and ownership (unassigned vs. assigned to IT Staff).
- **Comments & Notes:** Sample Public Comments and role-restricted Internal Notes populated on seeded tickets.
- **Default Seed Passwords:** All seeded test accounts use documented, non-production initial passwords (e.g. `Password123!`).

---

## 8. API Contract Summary

| Method | Endpoint Path | Permitted Roles | Description | Success Code |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and issue session/token | `200 OK` |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate current session/token | `200 OK` |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role | `200 OK` |
| `POST` | `/api/auth/change-password` | Authenticated | Change user password (mandatory or voluntary) | `200 OK` |
| `GET` | `/api/tickets` | Requester, IT Staff, Admin | Retrieve tickets (Requester sees owned; IT Staff/Admin sees Queue with search/filter/sort/page) | `200 OK` |
| `POST` | `/api/tickets` | Requester, IT Staff, Admin | Create a new IT ticket | `201 Created` |
| `GET` | `/api/tickets/:id` | Requester (owner), IT Staff, Admin | Retrieve detailed ticket view | `200 OK` |
| `PATCH` | `/api/tickets/:id/owner` | IT Staff, Admin | Claim or reassign ticket ownership | `200 OK` |
| `PATCH` | `/api/tickets/:id/priority` | IT Staff, Admin | Update IT Priority | `200 OK` |
| `PATCH` | `/api/tickets/:id/status` | Requester (resolve action), IT Staff, Admin | Update ticket status per permitted transitions | `200 OK` |
| `GET` | `/api/tickets/:id/comments` | Requester (owner), IT Staff, Admin | Retrieve Public Comments for ticket | `200 OK` |
| `POST` | `/api/tickets/:id/comments` | Requester (owner), IT Staff, Admin | Post a Public Comment on ticket | `201 Created` |
| `GET` | `/api/tickets/:id/notes` | IT Staff, Admin | Retrieve Internal Notes for ticket (`403` for Requester) | `200 OK` |
| `POST` | `/api/tickets/:id/notes` | IT Staff, Admin | Post an Internal Note on ticket (`403` for Requester) | `201 Created` |
| `POST` | `/api/tickets/:id/attachments` | Requester (owner), IT Staff, Admin | Upload file attachment to ticket | `201 Created` |
| `GET` | `/api/attachments/:id/download` | Requester (owner), IT Staff, Admin | Download attachment binary content | `200 OK` |
| `DELETE` | `/api/attachments/:id` | Requester (owner), IT Staff, Admin | Soft-remove attachment with reason | `200 OK` |
| `GET` | `/api/admin/users` | Admin | List user accounts with search and role filter | `200 OK` |
| `POST` | `/api/admin/users` | Admin | Create user account with initial password | `201 Created` |
| `PATCH` | `/api/admin/users/:id` | Admin | Edit user name, email, role, or active status | `200 OK` |
| `POST` | `/api/admin/users/:id/reset-password` | Admin | Set new initial password requiring change | `200 OK` |

*(For full JSON schemas, request/response examples, and error codes, refer to `docs/lab-03/api-spec.md`.)*

---

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion Statement |
|---|---|
| **AC-01** | Given an active user with valid credentials, when the user logs in via `POST /api/auth/login`, then the backend establishes authenticated access and returns user profile, role, and `mustChangePassword` status. |
| **AC-02** | Given a user with `mustChangePassword = true`, when login succeeds, then normal application screens remain unavailable and the mandatory Change Password screen is displayed until a valid new password is saved. |
| **AC-03** | Given an authenticated Requester, when any ticket API is invoked with a client-supplied `requesterId`, then the backend ignores the parameter and strictly enforces the authenticated session identity. |
| **AC-04** | Given a Requester account, when an Internal Note endpoint (`GET/POST /api/tickets/:id/notes`) is requested, then the backend rejects the request with `403 Forbidden` without exposing note content or existence. |
| **AC-05** | Given an IT Staff user, when accessing the Ticket Queue (`GET /api/tickets`), then a paginated list of all tickets is returned supporting search by keyword, filtering by status/priority/ownership, and sorting. |
| **AC-06** | Given an IT Staff user inspecting a ticket, when claiming unassigned ownership or reassigning to another active staff member, then ticket ownership updates successfully and is reflected in the queue. |
| **AC-07** | Given an IT Staff user, when updating the IT Priority of a ticket, then `itPriority` updates while `requestedPriority` remains unchanged. |
| **AC-08** | Given an IT Staff user, when performing a ticket status transition, then valid transitions succeed while invalid transitions are rejected with `400 Bad Request`. |
| **AC-09** | Given an authenticated Requester viewing an active owned ticket, when clicking "Problem Appears Resolved", then the ticket status updates to `WAITING_FOR_REQUESTER` (or review state) and notifies IT Staff. |
| **AC-10** | Given an authorized user (Requester owner, IT Staff, or Admin), when posting a Public Comment, then the comment is saved and displayed in the public comment thread. |
| **AC-11** | Given an IT Staff or Admin user, when posting or viewing an Internal Note, then notes are created and rendered exclusively within the role-restricted Internal Notes section. |
| **AC-12** | Given an Administrator, when viewing User Management (`GET /api/admin/users`), then a list of all accounts is displayed supporting search by name/email and filtering by role. |
| **AC-13** | Given an Administrator creating a user with valid details, when submitted, then a new account is created with `mustChangePassword = true`. Attempts with duplicate emails are rejected with `409 Conflict`. |
| **AC-14** | Given an Administrator editing a user, when modifying name, email, role, or active state, then updates apply successfully. Attempts to deactivate one's own account or the last active Admin are rejected. |
| **AC-15** | Given an Administrator, when setting a new initial password for a user, then the password updates and `mustChangePassword` is set to `true` for that user's next login. |
| **AC-16** | Given an inactive user account, when attempting authentication, then login fails with `401 Unauthorized` safe error feedback. |
| **AC-17** | Given an authenticated user, when clicking Logout, then the session is invalidated immediately and protected routes become inaccessible. |
| **AC-18** | Given responsive viewports (Desktop >=992px, Tablet 768-991px, Mobile <768px), when viewing IT Staff Queue or Admin screens, layout components adapt cleanly into stacked cards without horizontal overflow. |

---

## 10. Definition of Done

### Product Completion Checklist
- [ ] Complete implementation of all approved Lab 3 scope (Auth, Mandatory Password Change, IT Staff Queue/Detail, Ownership, IT Priority, Status Workflow, Public Comments, Internal Notes, Admin User Management).
- [ ] Satisfaction of all Acceptance Criteria (AC-01 through AC-18).
- [ ] Passing automated tests across all required levels (Unit, API, UI Component, UI Style, Responsive, E2E).
- [ ] Server-side enforcement of role and resource authorization on all protected endpoints.
- [ ] Full compliance with Zen Green design tokens and responsive layout constraints.
- [ ] Safe error handling with no exposed stack traces, sensitive user data, or protected note content.
- [ ] Verified database migration and idempotent seed data execution.
- [ ] Zero skipped, commented out, or disabled test cases.

### Course Delivery Requirements Checklist
- [ ] Feature branch workflow using `feature/12-lab3-specification` for contract documentation.
- [ ] Staged integration through `lab3-staging` before merging to `main`.
- [ ] Peer code review and approval documented in `docs/lab-03/reviewer.md`.
- [ ] AI prompt usage and reflection recorded in `docs/lab-03/ai-use.md`.
- [ ] Final submission PDF assembled with Answer Parts 1 through 9.

---

## 11. Assumptions and Decisions

| Decision ID | Choice / Decision | Technical Justification / Context |
|---|---|---|
| **DEC-01** | Session / Token Auth with HTTP-only Cookies | Standard secure Web application practice. Prevents XSS token theft compared to localStorage. Sends auth token automatically on API requests. |
| **DEC-02** | Password Hashing with Bcrypt (Salt Rounds = 10) | Industry-standard password hashing algorithm ensuring plain-text passwords are never stored in the database or logs. |
| **DEC-03** | Server-Side RBAC Middleware | Authorization checks are executed centrally via backend middleware prior to route handlers, ensuring UI control visibility never serves as a security boundary. |
| **DEC-04** | Status Transition Matrix Control | Explicit state machine logic in backend service validates target status against current status and user role before applying database updates. |
| **DEC-05** | Separate Tables for Public Comments and Internal Notes | Keeping `PublicComment` and `InternalNote` as separate database models enforces strict schema-level isolation and minimizes risk of accidental data leakage. |
| **DEC-06** | Minimalist User Management | Scope restricted strictly to user listing, search, role filtering, create/edit, single-role assignment, active toggle, and initial password reset to eliminate administrative bloat. |
