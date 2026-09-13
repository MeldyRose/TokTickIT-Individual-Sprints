# Lab 3 Test Plan and Traceability

## 1. Test Strategy

This test plan follows a **Test DD** (Test-Driven Documentation) approach where all test cases, security assertions, API contracts, and user flows are specified directly from the Sprint 3 engineering contract before code implementation begins. Implementation will proceed according to **TDD** (Test-Driven Development) principles: writing failing automated test suites first, implementing minimal code to satisfy test assertions, and refactoring to achieve 100% green test execution across all suites.

The test plan spans eight specialized testing levels:
- **Unit:** Verification of password hash generation, password complexity rules, status transition matrix logic, and query parameter builders.
- **API / Security Integration:** Endpoint credential verification, session/cookie handling, role-based access control (`401`/`403`), Requester ownership scoping, and payload validation.
- **UI Component:** React component behavior for Login, Mandatory Password Change, IT Staff Queue, IT Staff Ticket Detail, Public Comments, Internal Notes, and Admin User Management modals.
- **UI Style:** Zen Green token verification, badge styling, role indicators, and clear distinction between Public Comments and role-restricted Internal Notes.
- **Responsive:** Fluid layout adaptations across Desktop (>=992px), Tablet (768-991px), and Mobile (<768px) viewports without horizontal overflow.
- **Migration & Regression:** Verifying Lab 2 Requester data continuity, attachment lifecycle continuity, and removal of Development Requester selector.
- **Security & Authorization:** Direct API probing to verify non-administrators cannot access user management, and Requesters cannot access Internal Notes or unowned tickets.
- **End-to-End (E2E):** Full Playwright flows for Auth & Password Change, IT Staff Ticket Queue & Resolution, and Administrator User Management.

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-07, FR-02 | Password complexity validation utility | Returns `true` for strong passwords, `false` for weak passwords failing criteria | `server/tests/lab-03/passwordValidation.test.ts` | PASS |
| **UNIT-02** | Unit | BR-14, FR-18 | Ticket status transition matrix logic | Permits valid transitions (e.g. `NEW` → `OPEN`), rejects invalid transitions (e.g. `NEW` → `CLOSED`) | `server/tests/lab-03/statusMatrix.test.ts` | PASS |
| **API-01** | API | AC-01, FR-01 | Login endpoint `POST /api/auth/login` | Returns `200 OK` with user profile & session cookie for valid credentials | `server/tests/lab-03/auth.api.test.ts` | PASS |
| **API-02** | API | AC-16, BR-01, BR-08 | Inactive account or invalid login attempt | Returns `401 Unauthorized` with safe, non-enumerating error message | `server/tests/lab-03/auth.api.test.ts` | PASS |
| **API-03** | API | AC-02, BR-02 | Login with `mustChangePassword = true` account | Returns `200 OK` with `mustChangePassword: true` flag forcing redirect | `server/tests/lab-03/auth.api.test.ts` | PASS |
| **API-04** | API | AC-17, FR-03 | Logout endpoint `POST /api/auth/logout` | Returns `200 OK`, invalidates session cookie, blocks subsequent calls | `server/tests/lab-03/auth.api.test.ts` | PASS |
| **API-05** | API | AC-03, BR-03 | Requester API call with client-supplied `requesterId` | Ignores client `requesterId` and strictly enforces authenticated session identity | `server/tests/lab-03/authorization.api.test.ts` | PASS |
| **API-06** | API | AC-04, AC-11, BR-04 | Requester requesting Internal Notes `GET/POST /api/tickets/:id/notes` | Returns `403 Forbidden` without exposing any note metadata or content | `server/tests/lab-03/notes.api.test.ts` | PASS |
| **API-07** | API | AC-05, BR-21 | IT Staff Ticket Queue retrieval `GET /api/tickets` | Returns `200 OK` with search, filter (category/status/priority/owner), sort & page data | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| **API-08** | API | AC-06, BR-11 | Claim or reassign ticket ownership `PATCH /api/tickets/:id/owner` | Updates `ownerId` in database and returns updated owner object | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| **API-09** | API | AC-07, BR-12 | Update IT Priority `PATCH /api/tickets/:id/priority` | Updates `itPriority` while keeping `requestedPriority` unchanged | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| **API-10** | API | AC-08, BR-14 | Permitted ticket status update `PATCH /api/tickets/:id/status` | Applies valid status transition (`OPEN` → `IN_PROGRESS`); rejects invalid transition | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| **API-11** | API | AC-09, BR-05 | Requester "Problem Appears Resolved" status update | Requester sets status to `WAITING_FOR_REQUESTER`; blocks direct `RESOLVED`/`CLOSED` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| **API-12** | API | AC-10, BR-15 | Public Comment creation & retrieval `GET/POST /api/tickets/:id/comments` | Saves comment record with author identity; lists thread in chronological order | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| **API-13** | API | AC-11, BR-15 | Internal Note creation & retrieval for IT Staff / Admin | Saves internal note record; retrievable by IT Staff and Admin only | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| **API-14** | API | AC-12, FR-21 | Admin user list retrieval `GET /api/admin/users` | Returns user list with search (name/email) and role filter (`REQUESTER`/`IT_STAFF`/`ADMIN`) | `server/tests/lab-03/users-admin.api.test.ts` | PASS |
| **API-15** | API | AC-13, BR-19 | Admin create user `POST /api/admin/users` | Creates user account with `mustChangePassword = true`; rejects duplicate email (`409`) | `server/tests/lab-03/users-admin.api.test.ts` | PASS |
| **API-16** | API | AC-14, BR-17, BR-18 | Admin edit user & safety rules enforcement | Updates name/role/active state; blocks self-deactivation (`400`) & last admin removal (`400`) | `server/tests/lab-03/users-admin.api.test.ts` | PASS |
| **API-17** | API | AC-15, BR-06 | Admin reset initial password `POST /api/admin/users/:id/reset-password` | Updates password hash and sets `mustChangePassword = true` for target user | `server/tests/lab-03/users-admin.api.test.ts` | PASS |
| **UI-01** | UI Comp | AC-01, FR-01 | Login screen form submission & error handling | Shows inline field validation; handles submit busy state; displays safe failure banner | `client/tests/lab-03/Login.test.tsx` | PASS |
| **UI-02** | UI Comp | AC-02, FR-02 | Mandatory Change Password modal rendering | Blocks navigation when `mustChangePassword = true`; checks live password complexity rules | `client/tests/lab-03/ChangePassword.test.tsx` | PASS |
| **UI-03** | UI Comp | AC-05, BR-21 | IT Staff Ticket Queue filter & search controls | Debounces search input; applies status/priority/owner filters; updates pagination bar | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PASS |
| **UI-04** | UI Comp | AC-06..08, AC-11 | IT Staff Ticket Detail actions & note styling | Claim button updates owner; status dropdown updates badge; Internal Notes rendered amber | `client/tests/lab-03/StaffTicketDetail.test.tsx` | PASS |
| **UI-05** | UI Comp | AC-12..15 | Administrator User Management screen & modals | Renders user table; opens Create/Edit/Reset modals; handles validation & success toasts | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| **RESP-01** | Responsive | AC-18 | IT Staff Queue desktop table to mobile card shift | Desktop table layout converts to full-width stacked card view at `<768px` viewport | `client/tests/lab-03/Responsive.test.tsx` | PASS |
| **E2E-01** | E2E | AC-01, AC-02, AC-17 | E2E authentication & first-login password change flow | User logs in with initial password → forced password change → enters app → logs out | `e2e/lab-03/authentication.spec.ts` | PASS |
| **E2E-02** | E2E | AC-05..11 | E2E IT Staff queue discovery, claim, comments & resolution | Staff logs in → filters queue → claims ticket → adds internal note & public comment → resolves | `e2e/lab-03/staff-ticket-flow.spec.ts` | PASS |
| **E2E-03** | E2E | AC-12..16 | E2E Administrator User Management flow | Admin logs in → creates staff user → edits user details → resets password → tests safety rules | `e2e/lab-03/user-administration.spec.ts` | PASS |

---

## 3. Acceptance-Criterion Traceability Matrix

| AC ID | Acceptance Criterion Summary | Planned Automated Test File(s) | Test ID(s) |
|---|---|---|---|
| **AC-01** | Valid User Login & Session Establishment | `server/tests/lab-03/auth.api.test.ts`, `client/tests/lab-03/Login.test.tsx`, `e2e/lab-03/authentication.spec.ts` | `API-01`, `UI-01`, `E2E-01` |
| **AC-02** | Mandatory Password Change on Initial Password | `server/tests/lab-03/auth.api.test.ts`, `client/tests/lab-03/ChangePassword.test.tsx`, `e2e/lab-03/authentication.spec.ts` | `API-03`, `UI-02`, `E2E-01` |
| **AC-03** | Requester Scoping via Session Identity (Ignore client ID) | `server/tests/lab-03/authorization.api.test.ts` | `API-05` |
| **AC-04** | Internal Notes Forbidden for Requester (403 returned) | `server/tests/lab-03/notes.api.test.ts` | `API-06` |
| **AC-05** | IT Staff Queue Retrieval (Search, Filter, Sort, Page) | `server/tests/lab-03/staff-queue.api.test.ts`, `client/tests/lab-03/StaffTicketQueue.test.tsx`, `e2e/lab-03/staff-ticket-flow.spec.ts` | `API-07`, `UI-03`, `E2E-02` |
| **AC-06** | Ticket Ownership Claim / Reassign by IT Staff | `server/tests/lab-03/staff-ticket-detail.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx`, `e2e/lab-03/staff-ticket-flow.spec.ts` | `API-08`, `UI-04`, `E2E-02` |
| **AC-07** | IT Priority Modification by IT Staff | `server/tests/lab-03/staff-ticket-detail.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx` | `API-09`, `UI-04` |
| **AC-08** | Permitted Ticket Status Transition Enforcement | `server/tests/lab-03/statusMatrix.test.ts`, `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `UNIT-02`, `API-10` |
| **AC-09** | Requester "Problem Appears Resolved" Indication | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `API-11` |
| **AC-10** | Public Comments Posting and Listing | `server/tests/lab-03/comments-notes.api.test.ts`, `e2e/lab-03/staff-ticket-flow.spec.ts` | `API-12`, `E2E-02` |
| **AC-11** | Internal Notes Restricted to IT Staff & Admin | `server/tests/lab-03/comments-notes.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx`, `e2e/lab-03/staff-ticket-flow.spec.ts` | `API-13`, `UI-04`, `E2E-02` |
| **AC-12** | Administrator User Listing, Search & Role Filter | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx`, `e2e/lab-03/user-administration.spec.ts` | `API-14`, `UI-05`, `E2E-03` |
| **AC-13** | Admin User Creation & Duplicate Email Rejection | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx`, `e2e/lab-03/user-administration.spec.ts` | `API-15`, `UI-05`, `E2E-03` |
| **AC-14** | Admin User Editing & Safety Rules Enforcement | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx`, `e2e/lab-03/user-administration.spec.ts` | `API-16`, `UI-05`, `E2E-03` |
| **AC-15** | Admin Initial Password Reset | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx`, `e2e/lab-03/user-administration.spec.ts` | `API-17`, `UI-05`, `E2E-03` |
| **AC-16** | Inactive User Login Rejection | `server/tests/lab-03/auth.api.test.ts` | `API-02` |
| **AC-17** | Logout Session Revocation | `server/tests/lab-03/auth.api.test.ts`, `e2e/lab-03/authentication.spec.ts` | `API-04`, `E2E-01` |
| **AC-18** | Responsive Layout Transformation (<768px) | `client/tests/lab-03/Responsive.test.tsx` | `RESP-01` |

---

## 4. Responsive and Visual Checklist

| Viewport | Inspection Category | Inspection Criteria |
|---|---|---|
| **Desktop (>=992px)** | Layout Structure | Multi-column queue table; split ticket detail panels; full admin data table; side-by-side modal forms |
| **Tablet (768px - 991px)** | Layout Adaptation | Search and filter controls stack into two rows; ticket detail panels collapse into single column; preserved padding |
| **Mobile (<768px)** | Mobile Responsive | Queue table converts to stacked card list; Admin user list transforms into responsive cards; zero horizontal scroll |
| **All Viewports** | Zen Green Theme | Primary Green `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, Background `#F5F7F6` consistently applied |
| **All Viewports** | Badges & Visuals | Distinct status, priority, and role badges; amber background (`#FFFDE7`) and lock icon for Internal Notes |
| **All Viewports** | Accessibility | Keyboard focus rings (`#006B3C`) on inputs/buttons; accessible ARIA labels on controls and modals |

---

## 5. Test Commands

| Suite Name | Target Components | Execution Command |
|---|---|---|
| Server API & Unit Tests | Backend API, Auth, RBAC | `cd server && npm test tests/lab-03` |
| Client UI & Style Tests | React Component Suites | `cd client && npm test tests/lab-03` |
| End-to-End Tests | Full Application Flows | `npx playwright test e2e/lab-03` |

---

## 6. Final Results

| Test ID | Status | Execution Date | Evidence / Log Snippet |
|---|---|---|---|
| **UNIT-01** | PASS | 2026-09-13 | `✓ tests/lab-03/passwordValidation.test.ts (4 tests) - Validates password length and character classes` |
| **UNIT-02** | PASS | 2026-09-13 | `✓ tests/lab-03/statusMatrix.test.ts (8 tests) - Enforces permitted status transition matrix rules` |
| **API-01** | PASS | 2026-09-13 | `✓ tests/lab-03/auth.api.test.ts - POST /api/auth/login establishes session for valid credentials` |
| **API-02** | PASS | 2026-09-13 | `✓ tests/lab-03/auth.api.test.ts - Rejects inactive user & invalid password with safe 401 response` |
| **API-03** | PASS | 2026-09-13 | `✓ tests/lab-03/auth.api.test.ts - Flags mustChangePassword=true on first login` |
| **API-04** | PASS | 2026-09-13 | `✓ tests/lab-03/auth.api.test.ts - POST /api/auth/logout invalidates session token` |
| **API-05** | PASS | 2026-09-13 | `✓ tests/lab-03/authorization.api.test.ts - Ignores client requesterId and enforces session identity` |
| **API-06** | PASS | 2026-09-13 | `✓ tests/lab-03/notes.api.test.ts - Rejects Requester access to Internal Notes with 403 Forbidden` |
| **API-07** | PASS | 2026-09-13 | `✓ tests/lab-03/staff-queue.api.test.ts - GET /api/tickets returns search/filtered/sorted/paginated queue` |
| **API-08** | PASS | 2026-09-13 | `✓ tests/lab-03/staff-ticket-detail.api.test.ts - PATCH /api/tickets/:id/owner updates ownership` |
| **API-09** | PASS | 2026-09-13 | `✓ tests/lab-03/staff-ticket-detail.api.test.ts - PATCH /api/tickets/:id/priority updates IT Priority` |
| **API-10** | PASS | 2026-09-13 | `✓ tests/lab-03/staff-ticket-detail.api.test.ts - PATCH /api/tickets/:id/status enforces permitted workflow` |
| **API-11** | PASS | 2026-09-13 | `✓ tests/lab-03/staff-ticket-detail.api.test.ts - Requester Problem Appears Resolved updates status` |
| **API-12** | PASS | 2026-09-13 | `✓ tests/lab-03/comments-notes.api.test.ts - Public Comments creation and listing succeeds` |
| **API-13** | PASS | 2026-09-13 | `✓ tests/lab-03/comments-notes.api.test.ts - Internal Notes creation and listing restricted to staff/admin` |
| **API-14** | PASS | 2026-09-13 | `✓ tests/lab-03/users-admin.api.test.ts - GET /api/admin/users lists users with search and role filter` |
| **API-15** | PASS | 2026-09-13 | `✓ tests/lab-03/users-admin.api.test.ts - POST /api/admin/users creates user and rejects duplicate email` |
| **API-16** | PASS | 2026-09-13 | `✓ tests/lab-03/users-admin.api.test.ts - Edits user and enforces self-deactivation & last admin protection` |
| **API-17** | PASS | 2026-09-13 | `✓ tests/lab-03/users-admin.api.test.ts - Resets initial password and sets mustChangePassword=true` |
| **UI-01** | PASS | 2026-09-13 | `✓ tests/lab-03/Login.test.tsx - Handles login form validation, busy state, and error banner` |
| **UI-02** | PASS | 2026-09-13 | `✓ tests/lab-03/ChangePassword.test.tsx - Renders mandatory password change modal with complexity checks` |
| **UI-03** | PASS | 2026-09-13 | `✓ tests/lab-03/StaffTicketQueue.test.tsx - Queue filters, search debounce, and pagination working` |
| **UI-04** | PASS | 2026-09-13 | `✓ tests/lab-03/StaffTicketDetail.test.tsx - Ticket detail controls and amber internal notes rendered` |
| **UI-05** | PASS | 2026-09-13 | `✓ tests/lab-03/UserManagement.test.tsx - User management list and creation/edit modals rendered` |
| **RESP-01** | PASS | 2026-09-13 | `✓ tests/lab-03/Responsive.test.tsx - Queue table shifts to stacked cards on mobile (<768px)` |
| **E2E-01** | PASS | 2026-09-13 | `✓ e2e/lab-03/authentication.spec.ts - 2 passed Full authentication and password change flow` |
| **E2E-02** | PASS | 2026-09-13 | `✓ e2e/lab-03/staff-ticket-flow.spec.ts - 3 passed Complete IT Staff queue and ticket management flow` |
| **E2E-03** | PASS | 2026-09-13 | `✓ e2e/lab-03/user-administration.spec.ts - 2 passed Full Administrator user management flow` |

---

## 7. Known Limitations or Deferred Tests

| Scope Item | Status | Reason / Deferred Target |
|---|---|---|
| Actions Taken Workflow | Deferred | Out of scope for Lab 3; formal Actions Taken by IT Staff deferred to Lab 4 |
| Self-Registration & SSO | Deferred | Out of scope for Lab 3; accounts created by Administrator only |
| Formal SLA Calculations | Deferred | Out of scope for Lab 3; formal SLA calculation & escalations deferred to future release |
| Email Delivery Services | Deferred | Out of scope for Lab 3; initial passwords communicated out-of-band for local lab environment |
