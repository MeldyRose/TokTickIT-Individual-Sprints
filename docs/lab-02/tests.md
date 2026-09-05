# Lab 2 Test Plan and Results

## 1. Test Strategy
This test plan follows a **Test DD** (Test-Driven Documentation) approach where all test evidence and test cases are planned directly from the engineering specification prior to feature implementation. During implementation, **TDD** (Test-Driven Development) will be practiced: writing failing automated tests first, implementing the minimum correct behavior, and refactoring while ensuring all test suites remain 100% green.

The test plan spans six distinct testing levels:
- **Unit:** Verification of core business logic utilities (e.g., Ticket Number generator format).
- **API / Integration:** Server endpoint validation, request/response payload validation, HTTP status codes, attachment validation, and ownership isolation.
- **UI Component:** React component behavior, Development Requester selector, form validation triggers, state handling (busy, error, empty).
- **UI Style:** Visual token compliance, Zen Green theme consistency, button hierarchy, and badge styles.
- **Responsive:** Layout adaptations across desktop (>=992px), tablet (768-991px), and mobile (<768px) viewports.
- **E2E:** Full end-to-end user journey from Requester selection to ticket submission, attachment management, and list retrieval.

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-01, FR-03 | Ticket Number generator format | Returns string matching required pattern `TKT-YYYY-XXXXXX` | `server/tests/lab-02/ticketNumber.test.ts` | PASS |
| API-01 | API | AC-01, FR-02, BR-01 | Ticket creation endpoint `POST /api/tickets` | 201 Created; Ticket saved in DB; official Ticket Number returned | `server/tests/lab-02/tickets.test.ts` | PASS |
| API-02 | API | AC-02, AC-04, FR-04 | Paginated ticket list retrieval `GET /api/tickets` | 200 OK; returns paginated array of tickets scoped to `X-Requester-Id` header | `server/tests/lab-02/tickets.test.ts` | PASS |
| API-03 | API | AC-03, FR-07, BR-05 | Detail retrieval for unowned ticket `GET /api/tickets/:id` | 403 Forbidden or 404 Not Found; ticket data of another Requester is protected | `server/tests/lab-02/tickets.test.ts` | PASS |
| API-04 | API | AC-05, AC-06, FR-08..10 | Ticket search, filter, sort, and pagination | 200 OK; returns items correctly filtered by search query, category, status, system, and sort order | `server/tests/lab-02/tickets.test.ts` | PASS |
| API-05 | API | AC-07, FR-12, BR-07 | Attachment file upload `POST /api/tickets/:id/attachments` | 201 Created; validates file type (JPG/PNG/WEBP/PDF), max size (5MB), max active (5); saves metadata | `server/tests/lab-02/attachments.test.ts` | PASS |
| API-06 | API | AC-08, FR-14, BR-08 | Attachment soft removal `DELETE /api/attachments/:id` | 200 OK; sets `deletedAt` and `removalReason`; download endpoint blocks removed file | `server/tests/lab-02/attachments.test.ts` | PASS |
| API-07 | API | AC-10, BR-04 | Active Development Requesters retrieval `GET /api/requesters` | 200 OK; returns active requesters; excludes inactive requesters | `server/tests/lab-02/requesters.test.ts` | PASS |
| UI-01 | UI Component | AC-09, BR-06 | Form submission without mandatory fields | Field validation error message displayed; API submit function not invoked | `client/tests/lab-02/CreateTicket.test.tsx` | PASS |
| UI-02 | UI Component | AC-02, FR-05 | Unselected requester navigation state | Requester Selection screen rendered when no active requester is set | `client/tests/lab-02/MyTickets.test.tsx` | PASS |
| UI-03 | UI Component | AC-11, BR-10 | Empty list and no-results search states | Displays empty state / no-results component with "Clear Filters" action when 0 tickets match | `client/tests/lab-02/MyTickets.test.tsx` | PASS |
| UI-04 | UI Style | AC-13, BR-11 | Zen Green styling & accessibility attributes | Color tokens, badges, focus rings, read-only fields, and ARIA labels conform to UI spec | `client/tests/lab-02/RequesterSelection.test.tsx` | PASS |
| RESP-01 | Responsive | AC-12 | Mobile breakpoint layout shift (<768px) | Table layout transforms into stacked card view on mobile viewports without overflow | `client/tests/lab-02/Responsive.test.tsx` | PASS |
| E2E-01 | E2E | AC-01, AC-04, AC-07 | Complete ticket submission, file attachment, and list retrieval flow | Confirmation screen shows official number; ticket appears in My Tickets with attachment metadata | `e2e/lab-02/ticket-flow.spec.ts` | PASS |

## 3. Acceptance-Criterion Traceability

| AC ID | Acceptance Criterion Description | Planned Automated Test File(s) | Test ID(s) |
|---|---|---|---|
| **AC-01** | Ticket Creation & Official Number Display | `server/tests/lab-02/tickets.test.ts`, `e2e/lab-02/ticket-flow.spec.ts` | `API-01`, `E2E-01` |
| **AC-02** | Requester Selection Prompt when Unselected | `client/tests/lab-02/MyTickets.test.tsx`, `server/tests/lab-02/tickets.test.ts` | `UI-02`, `API-02` |
| **AC-03** | Ownership Protection — Cross-Requester Blocking | `server/tests/lab-02/tickets.test.ts` | `API-03` |
| **AC-04** | My Tickets Owned List Scoping | `server/tests/lab-02/tickets.test.ts`, `e2e/lab-02/ticket-flow.spec.ts` | `API-02`, `E2E-01` |
| **AC-05** | Search and Category/Status Filtering | `server/tests/lab-02/tickets.test.ts` | `API-04` |
| **AC-06** | Sorting and Pagination Controls | `server/tests/lab-02/tickets.test.ts` | `API-04` |
| **AC-07** | Attachment Upload & Metadata Display | `server/tests/lab-02/attachments.test.ts`, `e2e/lab-02/ticket-flow.spec.ts` | `API-05`, `E2E-01` |
| **AC-08** | Attachment Soft Removal & Download Block | `server/tests/lab-02/attachments.test.ts` | `API-06` |
| **AC-09** | Validation & Required Fields Error Handling | `client/tests/lab-02/CreateTicket.test.tsx` | `UI-01` |
| **AC-10** | Inactive Requester Exclusion from Selector | `server/tests/lab-02/requesters.test.ts` | `API-07` |
| **AC-11** | Empty / No Results Search State | `client/tests/lab-02/MyTickets.test.tsx` | `UI-03` |
| **AC-12** | Responsive Table-to-Card Shift (<768px) | `client/tests/lab-02/Responsive.test.tsx` | `RESP-01` |
| **AC-13** | Accessibility Focus & Zen Green Tokens | `client/tests/lab-02/UIStyle.test.tsx` | `UI-04` |

## 4. Responsive and Visual Checklist

| Viewport | Inspection Category | Inspection Criteria |
|---|---|---|
| **Desktop (>=992px)** | Layout Structure | App header with identity display, side-by-side forms, multi-column table for My Tickets |
| **Tablet (768px - 991px)** | Layout Adaptation | Two-column layout where practical; Summary and Description receive sufficient width |
| **Mobile (<768px)** | Mobile Responsive | Fields stack vertically; buttons remain touch-friendly; table shifts to cards; zero horizontal scroll |
| **All Viewports** | Zen Green Theme | Primary Green `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, quiet background `#F5F7F6` |
| **All Viewports** | Badge Consistency | Distinct badges for Priority (Low, Medium, High, Urgent) and Status (New, In Progress, Resolved, Closed) |
| **All Viewports** | Form Controls | Asterisk `*` for required fields; inline error messages immediately below inputs |
| **All Viewports** | Accessibility | Visible focus rings on keyboard Tab navigation; accessible ARIA labels on all controls |

## 5. Test Commands

| Suite Name | Execution Target | Command |
|---|---|---|
| Server API & Unit Tests | Backend Services | `cd server && npm test tests/lab-02` |
| Client UI & Style Tests | React Components | `cd client && npm test tests/lab-02` |
| End-to-End Tests | Full Application Flow | `npx playwright test e2e/lab-02` |

## 6. Final Results

| Test ID | Status | Execution Date | Evidence / Log Snippet |
|---|---|---|---|
| UNIT-01 | PASS | 2026-09-05 | `✓ tests/lab-02/ticketNumber.test.ts (1 test) - Returns string matching required pattern TKT-YYYY-XXXXXX` |
| API-01 | PASS | 2026-09-05 | `✓ tests/lab-02/tickets.test.ts - POST /api/tickets returns 201 Created with official Ticket Number` |
| API-02 | PASS | 2026-09-05 | `✓ tests/lab-02/tickets.test.ts - GET /api/tickets returns paginated tickets scoped strictly to X-Requester-Id` |
| API-03 | PASS | 2026-09-05 | `✓ tests/lab-02/ticketDetail.test.ts - GET /api/tickets/:id returns 404/403 for unowned ticket` |
| API-04 | PASS | 2026-09-05 | `✓ tests/lab-02/tickets.test.ts - GET /api/tickets supports search, filtering, sorting, and pagination` |
| API-05 | PASS | 2026-09-05 | `✓ tests/lab-02/attachments.api.test.ts - POST /api/tickets/:id/attachments validates file type, size (5MB), and max active (5)` |
| API-06 | PASS | 2026-09-05 | `✓ tests/lab-02/attachments.api.test.ts - DELETE /api/attachments/:id soft-removes file & blocks download` |
| API-07 | PASS | 2026-09-05 | `✓ tests/lab-02/requesters.test.ts - GET /api/requesters returns active requesters & excludes inactive` |
| UI-01 | PASS | 2026-09-05 | `✓ tests/lab-02/CreateTicket.test.tsx - Form submission triggers field validation error without calling API` |
| UI-02 | PASS | 2026-09-05 | `✓ tests/lab-02/MyTickets.test.tsx - Unselected requester renders Requester Selection screen` |
| UI-03 | PASS | 2026-09-05 | `✓ tests/lab-02/MyTickets.test.tsx - Displays empty state and clear filters action when 0 tickets match` |
| UI-04 | PASS | 2026-09-05 | `✓ tests/lab-02/RequesterSelection.test.tsx - Zen Green color tokens, badges, and header identity display verified` |
| RESP-01 | PASS | 2026-09-05 | `✓ tests/lab-02/Responsive.test.tsx - Desktop table layout transforms into stacked card view on mobile (<768px)` |
| E2E-01 | PASS | 2026-09-05 | `✓ e2e/lab-02/ticket-flow.spec.ts - 2 passed (18.6s) Complete submission, attachment, and list retrieval flow` |

## 7. Known Limitations or Deferred Tests

| Scope Item | Status | Reason / Deferred Target |
|---|---|---|
| Real Authentication & Passwords | Deferred | Out of scope for Lab 2; simulated via Development Requester Selector in Lab 2; full auth in Lab 3 |
| IT Staff Queue & Priority Change | Deferred | Out of scope for Lab 2; IT Staff workflow introduced in later lab |
| Ticket Comments & Work Tracking | Deferred | Out of scope for Lab 2; Public Comments and Internal Notes introduced in later lab |
| Ticket Status Lifecycle Changes | Deferred | Out of scope for Lab 2; Status transition beyond initial `NEW` status deferred to later lab |
