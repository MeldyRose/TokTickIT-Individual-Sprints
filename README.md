# TokTickIT-Individual-Sprints

TokTickIT is an IT service desk application developed for CPE 334.  
**Lab 2** establishes the **Requester Ticketing MVP** featuring:

- **Active Requester Selection:** Simulated identity context selection for Development Requesters.
- **Ticket Creation:** Official ticket number auto-generation (`TKT-YYYY-XXXXXX`) with multi-field validation.
- **My Tickets Scoped View:** Multi-criteria search, filtering (category, status, related system), sorting, pagination, and ownership isolation.
- **Ticket Details & Attachments:** Read-only ticket detail view, file attachment upload (JPG, PNG, WEBP, PDF up to 5 MB, max 5 active), binary streaming download, and soft removal with mandatory reason.
- **Zen Green UI Theme:** Accessible color palette (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`), responsive table-to-card layout, and ARIA attributes.

---

## Workspace Structure

- `client/` — Frontend built with React 18, TypeScript, Vite, Bootstrap 5, and Vitest.
- `server/` — Backend built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Vitest.
- `e2e/lab-02/` — End-to-End user flow tests using Playwright.
- `docs/lab-02/` — Engineering specification, test plan, UI spec, API spec, peer review record, and AI usage documentation.

---

## Prerequisites

- **Node.js:** v18+ (tested on v22/v24)
- **npm:** v10+
- **PostgreSQL:** v15+ (running locally on port 5432)
- **Git**

---

## Setup & Installation

### 1. Clone the repository

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

Ensure `server/.env` contains your PostgreSQL connection string and port:

```env
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

> **Note:** Do not commit `.env` or sensitive database credentials to source control.

### 4. Database Setup & Seeding

Make sure your local PostgreSQL database server is running, then execute Prisma database sync and seed from the `server` directory:

```bash
cd server
npx prisma db push
npm run prisma:seed
cd ..
```

This creates the database schema (RequesterUser, Category, RelatedSystem, Ticket, Attachment) and seeds initial reference data (4 categories, 7 related systems, 4 active requesters, and 1 inactive requester).

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

Open your browser at **http://localhost:5173** to select a Development Requester and test the ticketing workflow.

---

## Running Automated Tests

The repository includes a comprehensive 6-level test plan (Unit, API, UI Component, UI Style, Responsive, and E2E).

### 1. Backend Server API & Unit Tests

Validates Prisma models, Ticket Number generator, header-based ownership scoping (`X-Requester-Id`), and attachment constraints:

```bash
cd server
npm test -- --run
```

### 2. Frontend Client UI & Style Tests

Validates React components, form validation rules, active requester header display, Zen Green style tokens, and mobile responsiveness (<768px):

```bash
cd client
npm test -- --run
```

### 3. Playwright End-to-End (E2E) Tests

Validates the full user journey from Development Requester selection to ticket submission, ticket number display, attachment handling, and list scoping:

```bash
npx playwright test e2e/lab-02
```

---

## REST API Summary

All ticket and attachment endpoints enforce ownership protection using the `X-Requester-Id` header.

| Method | Endpoint | Description | Scoped / Protected |
|---|---|---|:---:|
| `GET` | `/api/health` | Service health check | No |
| `GET` | `/api/categories` | Retrieve active request categories | No |
| `GET` | `/api/requesters` | Retrieve active Development Requesters | No |
| `GET` | `/api/related-systems` | Retrieve active related systems | No |
| `POST` | `/api/tickets` | Create new support ticket (`TKT-YYYY-XXXXXX`) | `X-Requester-Id` |
| `GET` | `/api/tickets` | Retrieve paginated ticket list (search, filter, sort) | `X-Requester-Id` |
| `GET` | `/api/tickets/:id` | Retrieve full ticket details & active attachments | `X-Requester-Id` |
| `POST` | `/api/tickets/:id/attachments` | Upload file attachment (JPG/PNG/WEBP/PDF, $\le$5MB, max 5) | `X-Requester-Id` |
| `GET` | `/api/attachments/:id/metadata` | Retrieve attachment metadata | `X-Requester-Id` |
| `GET` | `/api/attachments/:id/download` | Download active binary attachment | `X-Requester-Id` |
| `DELETE` | `/api/attachments/:id` | Soft-remove attachment with removal reason | `X-Requester-Id` |

---

## Repository Directory Structure

```text
TokTickIT-Individual-Sprints/
├── client/                      # React frontend application
│   ├── src/                     # React components, context, and API client
│   └── tests/                   # Vitest UI & Responsive test suites
├── server/                      # Express backend application
│   ├── prisma/                  # Prisma schema and seed script
│   ├── src/                     # API routes, app setup, and utils
│   ├── uploads/                 # Uploaded file attachments storage
│   └── tests/                   # Supertest backend API test suites
├── e2e/                         # Playwright End-to-End test suites
│   └── lab-02/                  # Lab 2 E2E user journey tests
├── docs/                        # Sprint documentation
│   ├── lab-01/                  # Lab 1 requirements & records
│   └── lab-02/                  # Lab 2 specification, tests, ui-spec, api-spec, reviewer, ai-use
├── playwright.config.ts         # Playwright E2E configuration
├── package.json                 # Root script runner & dependencies
└── README.md                    # Project documentation
```
