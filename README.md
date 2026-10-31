# TokTickIT-Individual-Sprints

TokTickIT is a role-based IT service desk management application developed for CPE 334.  

**Lab 4** elevates TokTickIT into a production-grade operational IT Service Management (ITSM) system featuring:

- **Parent-Child Actions Taken Sub-Workflow:** Discrete chronological operational action lines recorded under tickets (`Parent Ticket` $\rightarrow$ `Child ActionTaken` records), capturing Action Date/Time, Performer, Description, Diagnostic Result, Follow-Up Required toggle, mandatory Follow-Up Note ($\ge 5$ chars), and Attachment Notes.
- **Performer Autonomy & Ticket Claiming:** Any IT Staff member or Administrator can record or edit Actions Taken on any ticket without mutating overall ticket ownership. Logging an action on an unassigned ticket with `claimTicket: true` atomically claims ownership for the performer.
- **Requester Read-Only Visibility:** Requesters have transparent, real-time read access to the chronological Actions Taken timeline on their owned tickets, while all action creation and editing mutations are strictly restricted to IT Staff (`403 Forbidden`).
- **Resolution Gate Enforcement:** Transitions to `RESOLVED` and `CLOSED` require satisfying the Resolution Gate: requiring $\ge 1$ Action Taken line and a substantive resolution summary ($\ge 10$ characters). Premature attempts return HTTP `422 Unprocessable Entity` with a structured diagnostic array (`MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`).
- **Optimistic Concurrency Control (OCC):** Stale-update collision detection on ticket and action mutations using atomic Prisma queries (`updateMany` matching `{ id, updatedAt: expectedUpdatedAt }`). Collisions return HTTP `409 Conflict` (code `STALE_UPDATE`), triggering a non-destructive conflict banner in the UI.
- **Dual Authoritative Operational Dashboards:**
  - **IT Staff Operations Dashboard (`/staff/dashboard`):** 7 interactive KPI metric cards (Unassigned, My Assigned, In Progress, Waiting for Requester, High/Urgent, Total Open, Resolved Today), average resolution time with safe zero-division, and Recent Tickets table with one-click drill-down filtering to `/staff/tickets`.
  - **Requester Dashboard (`/dashboard`):** Active tickets summary, amber "Action Required" alert banner for tickets awaiting user input (`WAITING_FOR_REQUESTER`), recent activity, and one-click drill-down to `/tickets`.
- **Zen Green Design System & WCAG AA Accessibility:** Keyboard focus rings (`2px solid #006B3C`), distinct color contrast ($\ge 4.5:1$), ARIA roles, and responsive adaptation across Desktop ($\ge 992\text{px}$), Tablet ($768\text{px}-991\text{px}$), and Mobile ($< 768\text{px}$) with zero horizontal scrolling ($w \le 100\text{vw}$).

---

## Workspace Structure

- `client/` — Frontend built with React 18, TypeScript, Vite, Bootstrap 5, and Vitest.
- `server/` — Backend built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Vitest.
- `e2e/lab-04/` — End-to-End user flow tests using Playwright (`actions-taken-flow.spec.ts`, `dashboards.spec.ts`, `ticket-resolution.spec.ts`).
- `e2e/lab-03/` — Legacy Lab 3 E2E test suites (`authentication.spec.ts`, `staff-ticket-flow.spec.ts`, `user-administration.spec.ts`).
- `docs/lab-04/` — Lab 4 Sprint specification, test plan & traceability matrix, UI spec, API spec, peer review record (`reviewer.md`), AI reflection (`ai-use.md`), and sprint README.
- `artifacts/lab-04/screenshots/` — Visual inspection screenshot evidence across breakpoints for staff dashboard, requester dashboard, and actions taken.

---

## Prerequisites

- **Node.js:** v18+ (tested on v22/v24)
- **npm:** v10+
- **PostgreSQL:** v15+ (running locally on port 5432)
- **Git**

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MeldyRose/TokTickIT-Individual-Sprints.git
cd TokTickIT-Individual-Sprints
```

### 2. Install Dependencies

Install root, client, and server dependencies:

```bash
# Install root dependencies (includes Playwright)
npm install

# Install client dependencies
npm --prefix client install

# Install server dependencies
npm --prefix server install
```

### 3. Environment Configuration

Create a `.env` file inside the `server/` directory based on `.env.example`:

```bash
cp server/.env.example server/.env
```
> **Note:** Do not commit `.env` or sensitive database credentials to source control.

### 4. Database Setup & Seeding

Ensure your local PostgreSQL database server is running, then apply migrations and run the seed script:

```bash
npm --prefix server run seed
```

The idempotent seed script populates default system categories, related systems, test user accounts across all 3 roles, and initial seeded tickets:

| Email | Default Password | Role | Description |
|---|---|---|---|
| `michael.b@example.com` | `Password123!` | `REQUESTER` | Active tickets; requester dashboard verification |
| `sarah.j@example.com` | `Password123!` | `REQUESTER` | Resolved tickets; history verification |
| `jennifer.a@example.com` | `Password123!` | `REQUESTER` | Mandatory password reset (`mustChangePassword: true`) |
| `alex.thompson@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer (Ticket queue lead) |
| `lisa.martinez@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer |
| `kevin.patel@toktickit.com` | `Password123!` | `IT_STAFF` | IT Staff engineer |
| `admin@toktickit.com` | `Password123!` | `ADMINISTRATOR` | System Administrator |

---

## Running the Application

Start the backend server in one terminal:

```bash
npm --prefix server run dev
```
*(Server runs at http://localhost:3000)*

Start the Vite frontend dev server in a second terminal:

```bash
npm --prefix client run dev
```
*(Client runs at http://localhost:5173)*

Open your browser at **http://localhost:5173** to sign in to TokTickIT.

---

## Running Automated Tests

The repository includes a comprehensive test suite across 9 specialized testing levels (Unit, API, Security Integration, OCC Concurrency, Migration/Rollback, UI Component, Accessibility, Responsive, and Playwright E2E).

### 1. Backend Server API & Unit Tests

Validates actions taken CRUD, ticket workflow, resolution gate diagnostics, OCC concurrency, staff & requester dashboard metrics, and migration rollback:

```bash
npm --prefix server test
```
*Result: 23 test files passed, 191/191 tests passed.*

### 2. Frontend Client UI & Component Tests

Validates Actions Taken feed, modals, workflow controls, resolution checklists, dashboard cards, and mobile layout responsiveness:

```bash
npm --prefix client test -- --run
```
*Result: 18 test files passed, 126/126 tests passed.*

### 3. Playwright End-to-End (E2E) Tests (Lab 4)

Automates full multi-role user flows including Actions Taken parent-child workflow, Requester & Staff dashboards, and ticket resolution lifecycle:

```bash
npm --prefix server run seed
npx playwright test e2e/lab-04 --workers=1
```
*Result: 4 passed.*

### 4. Responsive & Visual Inspection Screenshot Capture

Captures high-resolution evidence screenshots across Desktop, Tablet, and Mobile viewports with programmatic zero horizontal scroll assertions:

```bash
npm --prefix server run seed
npx playwright test e2e/capture-lab4-screenshots.spec.ts --workers=1
```
*Result: 3 passed, 18 screenshot artifacts generated.*

### 5. Full System Regression Tests (Lab 3)

```bash
npm --prefix server run seed
npx playwright test e2e/lab-03 --workers=1
```
*Result: 3 passed.*

---

## REST API Summary (Lab 4 Highlights)

All protected endpoints enforce server-side session authentication (`toktickit_session` cookie) and Role-Based Access Control (RBAC).

| Method | Endpoint | Permitted Roles | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions` | Requester (owner), Staff, Admin | Chronological list of actions taken on ticket |
| `POST` | `/api/tickets/:id/actions` | IT Staff, Admin | Record Action Taken line (`403` for Requester) |
| `PATCH` | `/api/tickets/:id/actions/:actionId` | IT Staff, Admin | Update Action Taken line (enforces OCC) |
| `PATCH` | `/api/tickets/:id/status` | Requester (advisory), Staff, Admin | Transition ticket status; enforces Resolution Gate (`422`) |
| `GET` | `/api/dashboard/staff` | IT Staff, Admin | 7 KPI counts, workload distribution, and recent tickets |
| `GET` | `/api/dashboard/requester` | Requester, Staff, Admin | User-scoped active tickets and action required alerts |

---

## Sprint Documentation

Comprehensive sprint contracts, traceability matrices, and review records:
- **Lab 4 Documentation:** [`docs/lab-04/`](docs/lab-04/README.md)
  - [`specification.md`](docs/lab-04/specification.md)
  - [`tests.md`](docs/lab-04/tests.md)
  - [`api-spec.md`](docs/lab-04/api-spec.md)
  - [`ui-spec.md`](docs/lab-04/ui-spec.md)
  - [`reviewer.md`](docs/lab-04/reviewer.md)
  - [`ai-use.md`](docs/lab-04/ai-use.md)
- **Lab 3 Documentation:** [`docs/lab-03/`](docs/lab-03/)
