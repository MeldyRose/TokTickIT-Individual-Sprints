# Lab 3 — Peer Review Record

**Author:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: @MeldyRose
**Peer reviewer:** Phattaratorn Mahatkeerati — 67070503433 — GitHub: @GGital

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| 40 | feature/12-lab3-specification | - All required documentation files exist under docs/lab-03/. - specification.md covers multi-role RBAC, auth & forced password change, IT staff queue/detail, internal notes vs public comments, and administrator user management. - tests.md details the planned test matrix and AC traceability (AC-01..18). - ui-spec.md and api-spec.md specify contract details following Zen Green design guidelines. - Specification is completed prior to feature implementation work. Ready to merge into lab3-staging! |
| 41 | feature/13-database-schema-evolution | - Prisma schema models for User, Ticket, PublicComment, InternalNote and Enums (Role, RequestedPriority, ITPriority, TicketStatus) match the contract. - Migration applies cleanly and seed data populates active/inactive requesters, IT staff, and admin accounts idempotently. - Backwards compatibility for existing tickets and attachments preserved. Good to merge! 👍 |
| 42 | feature/14-authentication | Changes Requested → Approved: Verified backend authentication endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password`). Initial review requested clarification on cookie security options; updated `toktickit_session` with `HttpOnly` and `SameSite` flags. `mustChangePassword` flag and bcrypt password hashing (salt 10) work as expected. Inactive users and invalid credentials return safe 401 response. Re-verified and approved! |
| 43 | feature/15-login-password-ui | - Centered Login card (/login) meets Zen Green styling requirements with inline field validation and error alert banner. - Mandatory Password Change screen (/change-password) blocks route access when mustChangePassword = true and shows real-time password complexity checklist (min 8 chars, casing, number, special char). - All component unit tests pass. Great job! |
| 44 | feature/16-requester-regression | Changes Requested → Approved: Initial review caught security vulnerability where `X-Requester-Id` header without valid session returned data. Implemented strict session derivation and rejection of unauthenticated header probing (`401 Unauthorized`). Requesters can post Public Comments and click "Problem Appears Resolved". Requesters attempting to access Internal Notes are rejected with 403 Forbidden. Re-verified and approved! |
| 45 | feature/17-ticket-queue-ui | - IT Staff Queue (/staff/tickets) renders responsive desktop table (>=992px) and stacked card list (<768px). - Debounced search bar, category filter, status filter, IT priority filter, and ownership toggles ("All", "Unassigned", "Assigned to Me") filter ticket queue correctly. - Pagination bar and Clear Filters button work as expected. Looks awesome! |
| 46 | feature/18-ticket-priority-workflow | - Claim unassigned ticket (PATCH /api/tickets/:id/owner) and staff reassignment logic work properly. - IT priority modification updates itPriority while keeping requestedPriority immutable. - Enforces permitted status transition matrix (BR-14) and rejects invalid status updates with 400 Bad Request. Clean implementation! |
| 47 | feature/19-comment-role-restricted | Changes Requested → Approved: Initial review flagged React hook-order and auth-loading state transition issue in `InternalNotesSection`. Fixed loading state and added unit test `InternalNotesAuthLoading.test.tsx`. Public Comments and Internal Notes sections rendered with distinct styling (green accent vs amber #FFFDE7 with lock icon 🔒 Internal Notes). Internal Notes API enforces strict server-side RBAC, blocking Requesters with 403. Re-verified and approved! |
| 48 | feature/20-user-management-ui | - Administrator User Management screen (/admin/users) renders user list with search (name/email) and role filter. - Create User, Edit User, and Reset Password modals validate input complexity and set mustChangePassword = true. - Enforces safety rules: self-deactivation blocked (BR-17) and last active administrator protection enforced (BR-18). Excellent work! |
| 49 | feature/21-e2e-inspection-docs | Approved: Verified Playwright E2E test suites (`authentication.spec.ts`, `staff-ticket-flow.spec.ts`, `user-administration.spec.ts`) passing 100%. Responsive component test (`Responsive.test.tsx`) verifies viewport layout shift (<768px). Build type errors in test file fixed, documentation matrix finalized, and peer review recorded. Approved for release to main! |

## Pull Requests I reviewed for my partner

### feature/12-lab3-specification
**My comment:** Reviewed all specification markdown files under `docs/lab-03/`. The specification clearly outlines the multi-role RBAC architecture, authentication & forced password change requirement, operational IT Staff queue/detail workflow, Internal Notes vs Public Comments security boundary, and Administrator user management interface. All Acceptance Criteria (AC-01 through AC-18) and Business Rules (BR-01 through BR-25) are traceably mapped in `tests.md`. Ready to merge into `lab3-staging`!  
**Partner's response:** Thanks for the review! Merging into staging now.

### feat/lab3-database-schema-evolution
**My comment:** Checked out the branch and ran migration & seed script.
- Model evolution from `RequesterUser` to `User` with `Role` enum (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) is correctly implemented.
- Ticket model foreign keys (`requesterId`, `ownerId`) and new fields (`itPriority`, `currentStatus`) are properly indexed.
- `PublicComment` and `InternalNote` database models are created with cascading deletes on `ticketId`.
- Idempotent seed script populates 5 requesters, 4 IT staff, 1 admin, and seeded tickets across statuses.

Approved and good to merge!  
**Partner's response:** -

### feat/lab3-auth-api
**My comment:** Approved! Checked backend authentication API logic:
- `POST /api/auth/login` validates email/password with bcrypt and sets `HttpOnly` session cookie (`toktickit_session`).
- `GET /api/auth/me` returns current authenticated user context and role.
- `POST /api/auth/change-password` updates password hash and flags `mustChangePassword = false`.
- Inactive user accounts and invalid credentials return safe 401 error responses.
- 13/13 backend auth test cases pass.  
**Partner's response:** -

### feat/lab3-login-password-ui
**My comment:** Reviewed the Login and Mandatory Password Change UI components.
- Login screen card is centered with clean Zen Green styling (`#006B3C`), inline error feedback, and loading busy states.
- Mandatory Password Change modal renders overlay blocking navigation when `mustChangePassword = true`.
- Password complexity checklist updates dynamically as character rules (min 8, casing, number, special char) are satisfied.
- All component tests pass cleanly. Good to merge!  
**Partner's response:** -

### feat/lab3-requester-regression
**My comment:** Approved!
- Verified complete removal of the temporary Lab 2 requester selector key and header.
- `GET/POST /api/tickets` strictly derives user identity from session context, ignoring client-supplied IDs.
- Requester "Problem Appears Resolved" action updates ticket status to `WAITING_FOR_REQUESTER`.
- Internal Notes endpoints return `403 Forbidden` when requested by Requesters.  
**Partner's response:** -

### feat/lab3-staff-ticket-queue
**My comment:** LGTM!
- Control toolbar features search bar with magnify icon, Category filter, Status filter, IT Priority filter, Ownership filter toggle, and Sort dropdown.
- Desktop table view (>=992px) and mobile stacked card view (<768px) adapt seamlessly without horizontal scroll.
- Pagination bar accurately calculates page counts and items counter.
- All UI component tests pass.  
**Partner's response:** -

### feat/lab3-ticket-workflow-priority
**My comment:** Approved!
- Claim ticket button updates `ownerId` to current logged-in staff member.
- Reassign dropdown lists active IT Staff and Admin users.
- `itPriority` dropdown updates ticket priority while preserving original `requestedPriority`.
- Permitted status transition matrix correctly enforces valid workflow transitions and returns 400 Bad Request for invalid steps.  
**Partner's response:** -

### feat/lab3-internal-notes-comments
**My comment:** Approved!
- Public Comments thread renders green accent container visible to Requesters and Staff.
- Internal Notes section renders amber background (`#FFFDE7`) with lock badge `🔒 Internal Notes (IT Staff & Admin Only)`.
- Server-side RBAC middleware prevents Requesters from reading or creating internal notes.
- Security probing API tests pass 100%.  
**Partner's response:** -

### feat/lab3-user-management-admin
**My comment:** Looks great! Approved 👍
- User management table displays Name, Email, Role badge, and Active status badge.
- Search input (name/email) and Role filter dropdown filter user records cleanly.
- Create User, Edit User, and Reset Password modals enforce password complexity and safety rules.
- Self-deactivation and last active administrator deactivation are properly blocked with safe error banners.  
**Partner's response:** -

### feat/lab3-e2e-inspection
**My comment:** Approved!
- All Playwright E2E test suites (`E2E-01`..`03`) run and pass cleanly.
- Responsive layout verification confirmed zero horizontal scroll across viewports.
- All 18 Acceptance Criteria (AC-01 through AC-18) are traceably satisfied.
- Ready for final merge into `main`!  
**Partner's response:** -
