# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
The goal of Lab 2 is to deliver a professional, self-service IT ticket management system MVP for Requesters using a temporary Development Requester identity for "user login" context. The increment enables Requesters to create IT support tickets, upload permitted supporting attachments (up to 5 MB, max 5 active attachments of type JPG, PNG, WEBP, PDF), receive a unique official Ticket Number, view their tickets in My Tickets, search/filter/sort/page through their tickets, inspect ticket detail views, add attachments to existing tickets, and soft-remove attachments with a reason, under strict Requester ownership protection.

## 2. Stakeholder Request Interpretation
Requesters require a dedicated self-service IT support portal in TockTickIT where they can log support requests, specify category and related system, indicate requested priority, upload supporting files, and track ticket status. Because full login will be introduced in Lab 3, a temporary Development Requester selection screen serves as a test "user login" selector. Requesters must be able to view their own tickets, search/filter/sort/page through ticket lists, inspect ticket details, and manage attachments, with strict backend data scoping ensuring one Requester cannot access another Requester's tickets.

## 3. Scope

### Included
- **Development Requester Selector:** Temporary test "login" selector allowing selection from active seeded Requesters.
- **Create Ticket:** Form interface and API for ticket submission (Summary, Description, Category, Related System, Requested Priority, Attachments).
- **My Tickets:** Paginated, searchable, filterable, and sortable list view of tickets belonging to the active Requester.
- **Requester Ticket Detail:** Read-only detailed view of an owned ticket, including status, priority, category, related system, metadata, and attachment management.
- **Attachment Lifecycle:** Uploading permitted files (JPG, PNG, WEBP, PDF, <= 5 MB, max 5 active attachments), metadata retrieval, secure file download, and soft removal with recorded removal reason.
- **Search, Filtering, Sorting & Pagination:** Multi-criteria querying on ticket lists.
- **Ownership Protection:** Requester-level data scoping on all tickets and attachment endpoints.

### Excluded
- **Authentication and Security:** Login/logout, passwords, password hashing, sessions, tokens, authenticated identities, and role-based authorization (Development Requester selector is for testing only).
- **IT Staff Workflow:** Staff dashboard, queue, claiming or reassigning tickets, changing IT priority, and ticket-owner functions.
- **Ticket Collaboration:** Public Comments, Internal Notes, and Actions Taken.
- **Ticket Lifecycle After Creation:** Status changes beyond initial New status, including resolution confirmation, resolving, closing, reopening, or cancelling tickets.
- **Administration Functions:** Administrator management of users, Requesters, roles, and reference data.

## 4. Functional Requirements

| FR ID | Functional Requirement Description |
|---|---|
| FR-01 | The system shall provide a Development Requester selection screen enabling selection of an active Requester for testing context. |
| FR-02 | The system shall allow a Requester to create a new IT support ticket capturing Summary, Description, Category, Related System, Requested Priority, and optional Attachments. |
| FR-03 | The system shall automatically generate and assign a unique official Ticket Number upon successful ticket submission. |
| FR-04 | The system shall provide a "My Tickets" screen displaying a list of tickets belonging strictly to the currently selected Requester. |
| FR-05 | The system shall display the Requester Selection screen when no active Requester identity is selected in the application context. |
| FR-06 | The system shall allow a Requester to view read-only details of a ticket they own. |
| FR-07 | The system shall enforce ownership protection by blocking access (returning 403 Forbidden or 404 Not Found) when a Requester attempts to view or modify a ticket owned by another Requester. |
| FR-08 | The system shall allow searching tickets in My Tickets by keyword in summary, description, or ticket number. |
| FR-09 | The system shall allow filtering tickets in My Tickets by Category, Status, and Related System. |
| FR-10 | The system shall allow sorting ticket lists by fields such as Created Date and Priority in ascending or descending order. |
| FR-11 | The system shall support pagination for ticket lists, returning page number, page size, total count, and total pages. |
| FR-12 | The system shall allow uploading permitted file attachments (JPG/JPEG, PNG, WEBP, PDF up to 5 MB per file, max 5 active attachments per ticket) to an owned ticket. |
| FR-13 | The system shall allow retrieving metadata and downloading binary file content for active attachments belonging to owned tickets. |
| FR-14 | The system shall allow performing soft removal on an attachment belonging to an owned ticket, recording a removal reason and blocking future download/preview while retaining metadata. |

## 5. Business Rules

| BR ID | Mandatory Business Rule |
|---|---|
| BR-01 | The official Ticket Number is generated by the backend and must be unique across all tickets. |
| BR-02 | A new Ticket begins with Current Status New. |
| BR-03 | Lab 2 uses a Development Requester selector instead of login. The selected identity is for testing only and is not authentication. |
| BR-04 | Only active Development Requesters can be selected. Inactive Requesters must be excluded from the Development Requester selector dropdown. |
| BR-05 | Requester ownership isolation: All ticket and attachment APIs must scope requests to the active Requester. Attempting to retrieve or modify data belonging to another Requester must return 403 Forbidden or 404 Not Found. |
| BR-06 | Field validation: Ticket Summary, Category, and Related System are required. Form submission with missing required fields must show field-level validation messages and prevent API submission. |
| BR-07 | Attachment constraints (Fixed): Allowed file types are JPG/JPEG, PNG, WEBP, and PDF. Maximum size is 5 MB per file. Maximum active attachments allowed per Ticket is five (5). |
| BR-08 | Attachment soft removal rule: Removal must be implemented as soft removal (`deletedAt` timestamp set and removal reason recorded). Soft-removed files MUST NOT be downloadable or previewed, but metadata remains visible on Ticket Detail. |
| BR-09 | Attachment upload failure behavior: If attachment upload fails during or after ticket creation, the application must handle the failure safely, preserving form inputs and reporting errors without creating corrupt state. |
| BR-10 | Empty and no-results states: When a Requester has no tickets, an empty state UI is shown. When filters match 0 tickets, a no-results state UI with a "Clear Filters" button is displayed. |
| BR-11 | Read-only fields in Ticket Detail: Ticket Number, Ticket Date, Requester, Category, Related System, Summary, Description, Requested Priority, IT Priority, and Current Status are read-only on Ticket Detail view. |
| BR-12 | Lab 3 Transition Readiness: The database schema and identity scoping design must allow seamless transition to real authentication in Lab 3 without breaking ticket ownership relationships. |

## 6. UI Specification Summary
- **App Shell & Navigation:** Header displaying TokTickIT title, My Tickets nav, Create Ticket nav, active Development Requester identity display, and "Change Requester" action button. Designed with the **Zen Green** theme.
- **Development Requester Selector Screen:** Renders title, explanatory text ("Select a Development Requester to test requester-specific ticket behavior. This is not a login screen..."), active Requester dropdown loaded from database, Continue button, loading state, empty state if no active Requesters exist, and safe API-failure state.
- **Create Ticket Screen:** Standard responsive form with labels above controls, red asterisks `*` for required fields (Category, Related System, Summary), multiline resizable Description, file dropzone, primary "Submit Ticket" button with busy/disabled state during submit, and secondary "Cancel" button.
- **My Tickets Screen:** Control bar with Search input, Category filter, Status filter, Related System filter, Sort dropdown, and "Clear Filters" button. Content area renders a multi-column data table on Desktop (>=992px) and stacked card list on Mobile (<768px). Pagination bar at bottom.
- **Requester Ticket Detail Screen:** Read-only view of ticket fields (Ticket No., Status, Priority, Category, Related System, Created Date, Summary, Description). Attachments section listing uploaded files with metadata, Download action, Upload Attachment action, and Soft Remove action with confirmation and reason prompt.
- **Responsive & Accessibility:** Multi-column layout on Desktop (>=992px), 2-column layout on Tablet (768-991px), stacked fields/cards on Mobile (<768px). Accessible ARIA labels, keyboard focus rings, non-color status/priority badges.

## 7. Data Changes

### Database Models & Schema Definitions

#### Model: Development Requester (`RequesterUser`)
| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key, CUID/UUID | Unique Requester identifier |
| `name` | String | Required | Full name of Requester |
| `email` | String | Unique, Required | Requester email address |
| `isActive` | Boolean | Required, Default `true` | Active status flag (inactive excluded from selector) |
| `createdAt` | DateTime | Default `now()` | Record creation timestamp |
| `updatedAt` | DateTime | Updated `now()` | Record update timestamp |

#### Model: Category (`Category`)
| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key, CUID/UUID | Unique Category identifier |
| `name` | String | Unique, Required | Category name (Account & Access, Hardware, Software, Network) |
| `description` | String | Optional | Description of category |
| `isActive` | Boolean | Required, Default `true` | Active status flag |

#### Model: Related System (`RelatedSystem`)
| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key, CUID/UUID | Unique Related System identifier |
| `name` | String | Unique, Required | System name (Email, Campus Wi-Fi, VPN, LEB2 App, Grade Submission App, Printer, Corporate Laptop) |
| `description` | String | Optional | Description of affected system |
| `isActive` | Boolean | Required, Default `true` | Active status flag |

#### Model: Ticket (`Ticket`)
| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key, CUID/UUID | Unique internal ticket ID |
| `ticketNumber` | String | Unique Index, Required | Generated official Ticket Number (e.g. `TKT-2025-001234`) |
| `summary` | String | Required, Max 255 chars | Ticket summary title |
| `description` | Text | Optional / Required | Full ticket problem description |
| `categoryId` | String | Foreign Key -> Category | Category reference ID |
| `relatedSystemId` | String | Foreign Key -> RelatedSystem | Related system reference ID |
| `requestedPriority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | Requester selected priority |
| `itPriority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | IT Staff assigned priority (default `MEDIUM`) |
| `currentStatus` | Enum | `NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | Ticket lifecycle status (begins with `NEW`) |
| `requesterId` | String | Foreign Key -> RequesterUser, Index | Requester ownership ID |
| `createdAt` | DateTime | Default `now()`, Index | Ticket submission timestamp |
| `updatedAt` | DateTime | Updated `now()` | Ticket last update timestamp |

#### Model: Attachment (`Attachment`)
| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key, CUID/UUID | Unique attachment identifier |
| `ticketId` | String | Foreign Key -> Ticket, Index | Parent ticket ID |
| `fileName` | String | Required | Original upload filename |
| `fileSize` | Int | Required, Max 5242880 (5MB) | Size in bytes |
| `mimeType` | String | Required (JPG, PNG, WEBP, PDF) | File MIME type |
| `filePath` | String | Required | Stored physical file path |
| `uploadedAt` | DateTime | Default `now()` | Upload timestamp |
| `deletedAt` | DateTime? | Nullable, Index | Soft removal timestamp |
| `removalReason` | String? | Nullable | Reason provided upon soft removal |

### Seed Data Decisions
- **Categories (4 required):** `Account and Access`, `Hardware`, `Software`, `Network`.
- **Related Systems (7 realistic):** `Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, `Grade Submission App`, `Printer`, `Corporate Laptop`.
- **Development Requesters:** At least 4 active Requesters (e.g. `Jennifer Anderson`, `Michael Brown`, `David Lee`, `Sarah Johnson`) and at least 1 inactive Requester (e.g. `Inactive User Test`).

## 8. API Contract Summary

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| `GET` | `/api/requesters` | Retrieve active Development Requesters (excludes inactive) | `200 OK` |
| `GET` | `/api/categories` | Retrieve active Ticket Categories | `200 OK` |
| `GET` | `/api/related-systems` | Retrieve active Related Systems | `200 OK` |
| `POST` | `/api/tickets` | Create a validated Ticket for selected Requester | `201 Created` |
| `GET` | `/api/tickets` | Retrieve selected Requester's tickets (search, filter, sort, page) | `200 OK` |
| `GET` | `/api/tickets/:id` | Retrieve details of an owned ticket | `200 OK` |
| `POST` | `/api/tickets/:id/attachments` | Upload attachment to owned ticket (max 5 MB, max 5 active) | `201 Created` |
| `GET` | `/api/attachments/:id/metadata` | Retrieve attachment metadata | `200 OK` |
| `GET` | `/api/attachments/:id/download` | Download active attachment file content | `200 OK` |
| `DELETE` | `/api/attachments/:id` | Soft-remove attachment with removal reason | `200 OK` |

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion |
|---|---|
| AC-01 | Given valid Ticket data, when the Requester submits the form, then one Ticket is saved and the official Ticket Number is displayed. |
| AC-02 | Given no Development Requester is selected, when the user attempts to open My Tickets, then the Requester Selection screen is shown. |
| AC-03 | Given Requester B is selected, when a Ticket belonging to Requester A is requested, then the Ticket data is not returned. |
| AC-04 | Given Requester A is selected, when My Tickets is opened, then only tickets belonging to Requester A are returned and listed. |
| AC-05 | Given a list of tickets, when a search keyword or category filter is applied, then only matching tickets are displayed. |
| AC-06 | Given multiple tickets, when sorting by date/priority or navigating pages, then the ticket list updates according to selected criteria. |
| AC-07 | Given a ticket owned by Requester A, when a valid file attachment (JPG, PNG, WEBP, PDF <= 5MB) is uploaded, then attachment metadata is saved and displayed on Ticket Detail. |
| AC-08 | Given an uploaded attachment on a ticket, when Requester A performs soft removal with a reason, then the attachment is marked as soft-removed and blocked from download/preview while retaining metadata. |
| AC-09 | Given missing required fields (e.g. empty Summary), when the user submits Create Ticket, then field validation error messages are displayed and the API is not called. |
| AC-10 | Given an inactive Development Requester in the database, when the user opens the Development Requester selector, then the inactive Requester is excluded from the dropdown options. |
| AC-11 | Given Requester A has no tickets matching filter criteria, when viewing My Tickets, then a clear no-results state message and "Clear Filters" action are displayed. |
| AC-12 | Given a mobile screen width (<768px), when viewing My Tickets, then the desktop ticket table layout transforms into stacked responsive card items without horizontal scrolling. |
| AC-13 | Given keyboard navigation, when traversing ticket forms and lists, visible focus indicators and accessible labels are present. |

## 10. Definition of Done

### Product Completion Checklist
- [ ] Implementation of all approved scope (Development Requester selector, Create Ticket, My Tickets, Ticket Detail, attachments, search, filtering, sorting, pagination, ownership protection).
- [ ] Satisfaction of all acceptance criteria (AC-01 through AC-13).
- [ ] Passing and traceable automated tests for all levels (Unit, API, UI Component, UI Style, Responsive, E2E).
- [ ] Conformance to data, API, UI, validation, and responsive specifications.
- [ ] Correct handling of success, failure, empty, loading, boundary, and soft-removal cases.
- [ ] All required tests pass from documented commands in the final `main` branch.
- [ ] Every acceptance criterion is linked to appropriate test evidence.
- [ ] No required test is skipped, disabled, or commented out.
- [ ] README setup and test instructions are current.

### Course Delivery Requirements Checklist
- [ ] Use of GitHub Issues and feature branches.
- [ ] Pull Requests through `lab2-staging` workflow before merging to `main`.
- [ ] Peer review and approval recorded in `reviewer.md`.
- [ ] AI prompt usage and reflection recorded in `ai-use.md`.
- [ ] Submission of required PDF evidence with Answer Parts 1 through 9.

## 11. Assumptions and Decisions

| Decision ID | Engineering Decision | Rationale / Context |
|---|---|---|
| DEC-01 | Requester Identity Scoping via `X-Requester-Id` Header | Simulates logged-in user identity before real authentication in Lab 3. Sent in HTTP requests to scope database queries. |
| DEC-02 | Attachment Soft Removal Implementation | `deletedAt` timestamp and `removalReason` recorded on `Attachment` record. Physical file preserved, download endpoint blocks access when `deletedAt != null`. |
| DEC-03 | Official Ticket Number Format Pattern | Format: `TKT-YYYY-XXXXXX` (e.g. `TKT-2025-001234`) generated by backend sequence/timestamp logic to ensure uniqueness. |
| DEC-04 | File Attachment Validation Limits | Enforced both client-side and server-side: allowed MIME types `image/jpeg`, `image/png`, `image/webp`, `application/pdf`; max size 5 MB (5,242,880 bytes); max 5 active attachments per ticket. |
