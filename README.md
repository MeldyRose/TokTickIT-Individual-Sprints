# TokTickIT-Individual-Sprints

TokTickIT is a role-based IT service desk management application developed for CPE 334.  
**Lab 3** transitions TokTickIT into a multi-role operational IT support system featuring:

- **Authentication & Forced Password Change:** Email and bcrypt password authentication (`POST /api/auth/login`), `HttpOnly` session cookie management (`toktickit_session`), session revocation upon logout (`POST /api/auth/logout`), current user profile context (`GET /api/auth/me`), and mandatory first-login password change workflow (`mustChangePassword = true`).
- **Role-Based Access Control (RBAC):** Server-side authorization enforcing 3 distinct roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) and strict Requester resource ownership scoping.
- **IT Staff Ticket Queue & Workflow Workbench:** Operational ticket queue (`/staff/tickets`) with search query matching, status filtering, IT priority filtering, category filtering, ownership toggle ("All", "Unassigned", "Assigned to Me"), sorting, and pagination.
- **Ticket Ownership, IT Priority & Permitted Status Transitions:** Ticket claiming/reassignment by IT Staff/Admins, IT Priority modification (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and permitted status transition matrix enforcement (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- **Public Comments & Confidential Internal Notes:** Chronological Public Comments section (visible to Requesters & Staff with green accent styling) and private Internal Notes section (`#FFFDE7` amber background with lock badge `🔒 Internal Notes`, restricted strictly to IT Staff & Admins with `403 Forbidden` for Requesters).
- **Minimalist Administrator User Management:** Admin interface (`/admin/users`) featuring user listing, search by name/email, role filtering, user creation modal with initial password, user editing modal, initial password reset modal, and safety rule enforcement (prohibiting self-deactivation and deactivating the last active administrator).
- **Zen Green Design System & Accessibility:** Zen Green color tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`), visible focus rings (`2px #006B3C`), ARIA labels, and responsive table-to-card layout shift (<768px) with zero horizontal scroll.

---

## Workspace Structure

- `client/` — Frontend built with React 18, TypeScript, Vite, Bootstrap 5, and Vitest.
- `server/` — Backend built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Vitest.
- `e2e/lab-03/` — End-to-End user flow tests using Playwright (`authentication.spec.ts`, `staff-ticket-flow.spec.ts`, `user-administration.spec.ts`).
- `docs/lab-03/` — Sprint specification, test plan & matrix, UI spec, API spec, peer review record (`reviewer.md`), and AI reflection (`ai-use.md`).

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
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 3. Environment Configuration

Create a `.env` file inside the `server/` directory based on `.env.example`:

```bash
cp server/.env.example server/.env
```
> **Note:** Do not commit `.env` or sensitive database credentials to source control.

### 4. Database Setup & Seeding

Ensure your local PostgreSQL database server is running, then apply database schema migrations and run the seed script from the `server` directory:

```bash
cd server
npx prisma db push
npm run seed
cd ..
```

The idempotent seed script populates default system categories, related systems, test user accounts across all 3 roles, and initial seeded tickets:

| Email | Default Password | Role | Must Change Password |
|---|---|---|:---:|
| `jennifer.a@example.com` | `Password123!` | `REQUESTER` | `true` |
| `michael.b@example.com` | `Password123!` | `REQUESTER` | `false` |
| `alex.thompson@toktickit.com` | `Password123!` | `IT_STAFF` | `false` |
| `admin@toktickit.com` | `Password123!` | `ADMINISTRATOR` | `false` |

---

## Running the Application

Start the backend server in one terminal:

```bash
cd server
npm run dev
```
*(Server runs at http://localhost:3000)*

Start the Vite frontend dev server in a second terminal:

```bash
cd client
npm run dev
```
*(Client runs at http://localhost:5173)*

Open your browser at **http://localhost:5173** to sign in to TokTickIT.

---

## Running Automated Tests

The repository includes a comprehensive test suite across 8 specialized testing levels (Unit, API, Security Integration, UI Component, UI Style, Responsive, Migration/Regression, and Playwright E2E).

### 1. Backend Server API & Unit Tests

Validates password complexity rules, status transition matrix, session cookies, RBAC authorization (`401`/`403`), and admin user management APIs:

```bash
npm run test:server
```

### 2. Frontend Client UI & Style Tests

Validates React component behavior, Login validation, Mandatory Password Change checklist, IT Staff Queue debounced search/filters, Admin User Management modals, Zen Green tokens, and mobile layout responsiveness (`Responsive.test.tsx`):

```bash
npm run test:client
```

### 3. Playwright End-to-End (E2E) Tests

Automates full user flows including authentication & password change (`E2E-01`), staff ticket queue, priority, public comments & internal notes (`E2E-02`), and administrator user management (`E2E-03`):

```bash
npm run test:e2e
```

---

## REST API Summary

All protected endpoints enforce server-side session authentication (`toktickit_session` cookie) and Role-Based Access Control (RBAC).

| Method | Endpoint | Permitted Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate email/password credentials & issue session |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate active authenticated session |
| `GET` | `/api/auth/me` | Authenticated | Retrieve profile context & role of current user |
| `POST` | `/api/auth/change-password` | Authenticated | Change user password (mandatory or voluntary) |
| `GET` | `/api/tickets` | Requester, IT Staff, Admin | Retrieve tickets (Requester sees owned; Staff/Admin sees Queue with search/filter/sort/page) |
| `POST` | `/api/tickets` | Requester, IT Staff, Admin | Create a new IT ticket |
| `GET` | `/api/tickets/:id` | Requester (owner), Staff, Admin | Retrieve detailed ticket view & attachments |
| `PATCH` | `/api/tickets/:id/owner` | IT Staff, Admin | Claim unassigned ticket or reassign ownership |
| `PATCH` | `/api/tickets/:id/priority` | IT Staff, Admin | Update IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) |
| `PATCH` | `/api/tickets/:id/status` | Requester (resolve), Staff, Admin | Update ticket status per permitted workflow transitions |
| `GET` | `/api/tickets/:id/comments` | Requester (owner), Staff, Admin | Retrieve Public Comments for ticket |
| `POST` | `/api/tickets/:id/comments` | Requester (owner), Staff, Admin | Post a Public Comment on ticket |
| `GET` | `/api/tickets/:id/notes` | IT Staff, Admin | Retrieve Internal Notes (`403` for Requester) |
| `POST` | `/api/tickets/:id/notes` | IT Staff, Admin | Post an Internal Note (`403` for Requester) |
| `POST` | `/api/tickets/:id/attachments` | Requester (owner), Staff, Admin | Upload file attachment (JPG/PNG/WEBP/PDF, $\le$5MB, max 5) |
| `GET` | `/api/attachments/:id/download` | Requester (owner), Staff, Admin | Download attachment binary file |
| `DELETE` | `/api/attachments/:id` | Requester (owner), Staff, Admin | Soft-remove attachment with reason |
| `GET` | `/api/admin/users` | Admin | List user accounts with search & role filter |
| `POST` | `/api/admin/users` | Admin | Create user account with initial password (`mustChangePassword = true`) |
| `PATCH` | `/api/admin/users/:id` | Admin | Edit user details, role, or active status (enforces safety rules) |
| `POST` | `/api/admin/users/:id/reset-password` | Admin | Reset initial password requiring change on next login |

---

## Repository Directory Structure

```text
TokTickIT-Individual-Sprints/
├── client/                      # React frontend application
│   ├── src/                     # React components, context, and API client
│   └── tests/                   # Vitest UI & Responsive test suites (lab-03)
├── server/                      # Express backend application
│   ├── prisma/                  # Prisma schema, migrations, and seed script
│   ├── src/                     # API routes, auth middleware, and services
│   ├── uploads/                 # Uploaded file attachments storage
│   └── tests/                   # Vitest backend API & RBAC test suites (lab-03)
├── e2e/                         # Playwright End-to-End test suites
│   └── lab-03/                  # Lab 3 E2E user journey tests (auth, staff flow, admin)
├── docs/                        # Sprint documentation
│   ├── lab-01/                  # Lab 1 requirements & records
│   ├── lab-02/                  # Lab 2 specification, tests, ui-spec, api-spec, reviewer, ai-use
│   └── lab-03/                  # Lab 3 specification, tests, ui-spec, api-spec, reviewer, ai-use
├── playwright.config.ts         # Playwright E2E configuration
├── package.json                 # Root script runner & dependencies
└── README.md                    # Project documentation
```
