# Lab 4 REST API Specification

## 1. Overview & Security Architecture

### 1.1 Authentication & Session Handling
- **Session Mechanism:** Relies on HTTP-only cookie (`toktickit_session`) or Bearer token established in Lab 3.
- **Role Enforcement:** Server-side RBAC middleware validates user role prior to executing any route handler. Hidden UI elements are never relied upon as security boundaries.
- **Error Responses:** Unauthenticated requests return `401 Unauthorized`. Requests by unauthorized roles (e.g. Requesters calling Actions Taken, Parent-Child, or Dashboard APIs) return `403 Forbidden` with no sensitive metadata disclosed.

### 1.2 Unified Error Envelope
All error responses return a standardized JSON envelope:
```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | INVALID_INPUT | NOT_FOUND | CONFLICT | RESOLUTION_GATE_FAILED | INTERNAL_ERROR",
    "message": "Human readable summary of the error.",
    "details": [
      {
        "field": "summary",
        "issue": "Summary must be between 3 and 150 characters."
      }
    ]
  }
}
```

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken
Retrieve all recorded Actions Taken for a specific ticket in chronological order.

- **Method:** `GET`
- **Path:** `/api/tickets/:id/actions`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "ticketId": "cuid_ticket_123",
  "actions": [
    {
      "id": "cuid_action_001",
      "ticketId": "cuid_ticket_123",
      "actionType": "INVESTIGATION",
      "summary": "Verified switch port flap on Port 24",
      "details": "Connected to Switch-SW02 via console. Port 24 was logging excessive CRC error frames. Replaced patch cable and ran diagnostic loopback.",
      "timeSpentMinutes": 35,
      "performer": {
        "id": "cuid_user_alex",
        "name": "Alex Thompson",
        "email": "alex.thompson@toktickit.com",
        "role": "IT_STAFF"
      },
      "createdAt": "2026-10-28T09:15:00.000Z"
    },
    {
      "id": "cuid_action_002",
      "ticketId": "cuid_ticket_123",
      "actionType": "HARDWARE_REPAIR",
      "summary": "Replaced SFP optical transceiver module",
      "details": "Installed replacement 10G-SR SFP module in Slot 1. Link established immediately. CRC errors cleared.",
      "timeSpentMinutes": 25,
      "performer": {
        "id": "cuid_user_lisa",
        "name": "Lisa Martinez",
        "email": "lisa.martinez@toktickit.com",
        "role": "IT_STAFF"
      },
      "createdAt": "2026-10-28T10:45:00.000Z"
    }
  ],
  "totalActions": 2,
  "totalTimeSpentMinutes": 60
}
```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user is a Requester.
  - `404 Not Found`: Ticket does not exist.

---

### 2.2 Log Action Taken
Record a discrete operational intervention on a ticket. Records the authenticated user as the performer.

- **Method:** `POST`
- **Path:** `/api/tickets/:id/actions`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Request Body:**
```json
{
  "actionType": "SOFTWARE_PATCH",
  "summary": "Applied security patch KB5029351 to workstation",
  "details": "Rebooted machine into safe mode, uninstalled corrupt DLL, and deployed vendor patch KB5029351. Verified application launches normally without crash.",
  "timeSpentMinutes": 45,
  "claimTicket": false
}
```
- **Request Body Parameters:**
  - `actionType` *(string, required)*: One of `DIAGNOSIS`, `INVESTIGATION`, `WORKAROUND`, `VENDOR_ESCALATION`, `HARDWARE_REPAIR`, `SOFTWARE_PATCH`, `COMMUNICATION`, `RESOLUTION_STEP`, `OTHER`.
  - `summary` *(string, required)*: Length 3 to 150 characters.
  - `details` *(string, required)*: Length 10 to 2,000 characters.
  - `timeSpentMinutes` *(integer, required)*: Non-negative integer $\ge 0$ and $\le 1440$.
  - `claimTicket` *(boolean, optional)*: If `true` and the ticket is currently unassigned, sets `ownerId` to the authenticated user.
- **Success Response (`201 Created`):**
```json
{
  "action": {
    "id": "cuid_action_003",
    "ticketId": "cuid_ticket_123",
    "actionType": "SOFTWARE_PATCH",
    "summary": "Applied security patch KB5029351 to workstation",
    "details": "Rebooted machine into safe mode, uninstalled corrupt DLL, and deployed vendor patch KB5029351. Verified application launches normally without crash.",
    "timeSpentMinutes": 45,
    "performer": {
      "id": "cuid_user_alex",
      "name": "Alex Thompson",
      "email": "alex.thompson@toktickit.com",
      "role": "IT_STAFF"
    },
    "createdAt": "2026-10-28T11:20:00.000Z"
  },
  "ticketOwnerId": "cuid_user_alex"
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing required fields, invalid actionType, or length constraints violated.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user is a Requester.
  - `404 Not Found`: Ticket does not exist.

---

## 3. Parent-Child Relationship Endpoints

### 3.1 List Linked Child Tickets
Retrieve all child tickets linked to a parent ticket.

- **Method:** `GET`
- **Path:** `/api/tickets/:id/children`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "parentId": "cuid_ticket_parent",
  "parentTicketNumber": "TCK-2026-0040",
  "children": [
    {
      "id": "cuid_ticket_child1",
      "ticketNumber": "TCK-2026-0041",
      "summary": "Unable to connect to shared drive in Dept A",
      "requestedPriority": "MEDIUM",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "requester": {
        "id": "cuid_user_req1",
        "name": "Michael Brown"
      },
      "owner": {
        "id": "cuid_user_staff1",
        "name": "Alex Thompson"
      },
      "createdAt": "2026-10-28T08:30:00.000Z"
    },
    {
      "id": "cuid_ticket_child2",
      "ticketNumber": "TCK-2026-0042",
      "summary": "Shared drive Z: error 0x80070035",
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "RESOLVED",
      "requester": {
        "id": "cuid_user_req2",
        "name": "Jennifer Anderson"
      },
      "owner": {
        "id": "cuid_user_staff2",
        "name": "Lisa Martinez"
      },
      "createdAt": "2026-10-28T08:45:00.000Z"
    }
  ],
  "totalChildren": 2,
  "openChildrenCount": 1
}
```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user is a Requester.
  - `404 Not Found`: Parent ticket does not exist.

---

### 3.2 Link Child Ticket
Link an existing ticket as a child to the specified parent ticket.

- **Method:** `POST`
- **Path:** `/api/tickets/:id/children`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Request Body:**
```json
{
  "childTicketId": "cuid_ticket_child1"
}
```
- **Validation & Business Rules Checked:**
  - `childTicketId !== id` (Self-linking prohibited $\rightarrow$ `400 Bad Request`).
  - Target parent cannot already be a child ticket (`target.parentId !== null` $\rightarrow$ `409 Conflict`).
  - Target child ticket cannot already have its own children (`child.children.length > 0` $\rightarrow$ `409 Conflict`).
  - Target child ticket cannot already be linked to another parent (`child.parentId !== null` $\rightarrow$ `409 Conflict`).
- **Success Response (`200 OK`):**
```json
{
  "message": "Child ticket linked successfully.",
  "parentId": "cuid_ticket_parent",
  "childTicket": {
    "id": "cuid_ticket_child1",
    "ticketNumber": "TCK-2026-0041",
    "summary": "Unable to connect to shared drive in Dept A",
    "currentStatus": "IN_PROGRESS",
    "parentId": "cuid_ticket_parent"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: `childTicketId` missing or equal to parent id.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: User is a Requester.
  - `404 Not Found`: Parent or child ticket not found.
  - `409 Conflict`: Hierarchy depth limit exceeded (attempted multi-level hierarchy) or ticket already linked.

---

### 3.3 Unlink Child Ticket
Remove the parent-child relationship between a parent and child ticket.

- **Method:** `DELETE`
- **Path:** `/api/tickets/:id/children/:childId`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "message": "Child ticket unlinked successfully.",
  "parentId": "cuid_ticket_parent",
  "unlinkedChildTicketId": "cuid_ticket_child1"
}
```
- **Error Responses:**
  - `400 Bad Request`: Child ticket is not linked to this parent.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: User is a Requester.
  - `404 Not Found`: Parent or child ticket not found.

---

## 4. Status Workflow & Resolution Gate Endpoint

### 4.1 Update Ticket Status
Update the status of a ticket per the state machine. If target status is `RESOLVED` or `CLOSED`, enforces the **Resolution Gate**.

- **Method:** `PATCH`
- **Path:** `/api/tickets/:id/status`
- **Permitted Roles:**
  - `IT_STAFF`, `ADMINISTRATOR`: All permitted transitions.
  - `REQUESTER`: Permitted only to trigger `WAITING_FOR_REQUESTER` ("Problem Appears Resolved"). Direct transition to `RESOLVED` or `CLOSED` is rejected (`403 Forbidden`).
- **Request Body (Standard Transition):**
```json
{
  "status": "IN_PROGRESS"
}
```
- **Request Body (Resolution Transition with Resolution Gate Fields):**
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Replaced bad SFP optical module on switch port 24 and restored network connectivity to Building A."
}
```

#### 4.1.1 Resolution Gate Verification Logic
When `status === 'RESOLVED'`:
1. **Actions Taken Check:** Queries `ActionTaken` records for `ticketId`. Must have $\ge 1$ records.
2. **Resolution Summary Check:** `resolutionSummary` must be provided and $\ge 10$ characters.
3. **Child Tickets Check:** Queries child tickets (`WHERE parentId = :id`). All must have `currentStatus IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.

#### 4.1.2 Success Response (`200 OK`)
```json
{
  "id": "cuid_ticket_123",
  "ticketNumber": "TCK-2026-0040",
  "currentStatus": "RESOLVED",
  "resolvedAt": "2026-10-28T12:00:00.000Z",
  "closedAt": null,
  "resolutionSummary": "Replaced bad SFP optical module on switch port 24 and restored network connectivity to Building A.",
  "updatedAt": "2026-10-28T12:00:00.000Z"
}
```

#### 4.1.3 Resolution Gate Failure Response (`422 Unprocessable Entity`)
When one or more Resolution Gate prerequisites are unsatisfied, the server rejects the request with HTTP `422`:
```json
{
  "error": {
    "code": "RESOLUTION_GATE_FAILED",
    "message": "Ticket cannot be resolved until all resolution prerequisites are satisfied.",
    "details": [
      {
        "criterion": "MISSING_ACTION_TAKEN",
        "message": "At least one Action Taken must be logged before resolving this ticket."
      },
      {
        "criterion": "MISSING_RESOLUTION_SUMMARY",
        "message": "A resolution summary of at least 10 characters is required."
      },
      {
        "criterion": "UNRESOLVED_CHILD_TICKETS",
        "message": "1 child ticket(s) are still active.",
        "blockingTickets": [
          {
            "ticketNumber": "TCK-2026-0041",
            "summary": "Unable to connect to shared drive in Dept A",
            "currentStatus": "IN_PROGRESS"
          }
        ]
      }
    ]
  }
}
```

- **Other Error Responses:**
  - `400 Bad Request`: Invalid transition per BR-10 status transition matrix.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Requester attempting direct resolution.
  - `404 Not Found`: Ticket not found.

---

## 5. Operational Dashboard Analytics Endpoints

### 5.1 Dashboard Metric Cards
Retrieve the primary operational KPI figures.

- **Method:** `GET`
- **Path:** `/api/dashboard/metrics`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "metrics": {
    "totalOpen": 48,
    "unassigned": 12,
    "waitingForRequester": 9,
    "urgentOrHigh": 6,
    "resolvedToday": 14,
    "avgResolutionMinutes": 225,
    "avgResolutionFormatted": "3h 45m"
  },
  "calculatedAt": "2026-10-28T12:05:00.000Z",
  "timeWindowDays": 30
}
```
- **Error Responses:**
  - `401 Unauthorized`: Missing session.
  - `403 Forbidden`: Requester accessing staff dashboard.

---

### 5.2 Dashboard Queue Breakdowns
Retrieve categorical and distribution breakdowns for queue visualization.

- **Method:** `GET`
- **Path:** `/api/dashboard/breakdown`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "byStatus": [
    { "status": "NEW", "count": 10, "percentage": 20.8 },
    { "status": "OPEN", "count": 15, "percentage": 31.3 },
    { "status": "IN_PROGRESS", "count": 14, "percentage": 29.2 },
    { "status": "WAITING_FOR_REQUESTER", "count": 9, "percentage": 18.7 }
  ],
  "byPriority": [
    { "priority": "URGENT", "count": 2, "percentage": 4.2 },
    { "priority": "HIGH", "count": 4, "percentage": 8.3 },
    { "priority": "MEDIUM", "count": 28, "percentage": 58.3 },
    { "priority": "LOW", "count": 14, "percentage": 29.2 }
  ],
  "byCategory": [
    { "categoryId": "cuid_cat_net", "categoryName": "Network / Wi-Fi", "count": 18, "percentage": 37.5 },
    { "categoryId": "cuid_cat_hw", "categoryName": "Hardware & Equipment", "count": 14, "percentage": 29.2 },
    { "categoryId": "cuid_cat_sw", "categoryName": "Software & Applications", "count": 10, "percentage": 20.8 },
    { "categoryId": "cuid_cat_acc", "categoryName": "Access & Permissions", "count": 6, "percentage": 12.5 }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized`: Missing session.
  - `403 Forbidden`: Requester accessing staff dashboard.

---

## 6. HTTP Status Code Catalog & Failure Matrix

| Status Code | Code Meaning | Scenarios / Endpoints |
|---|---|---|
| `200 OK` | Successful retrieval or modification | `GET /api/tickets/:id/actions`, `GET /api/dashboard/metrics`, `PATCH /api/tickets/:id/status` (valid transition) |
| `201 Created` | Successful entity creation | `POST /api/tickets/:id/actions` |
| `400 Bad Request` | Missing required payload fields, invalid actionType, invalid status transition per state machine, self-linking ticket |
| `401 Unauthorized` | Missing authentication cookie or expired session |
| `403 Forbidden` | Requester attempting to access Actions Taken, Dashboard, or direct resolution |
| `404 Not Found` | Ticket or child ticket does not exist |
| `409 Conflict` | Circular or multi-tier hierarchy attempt (linking ticket that already has children, or linking to a ticket that is already a child) |
| `422 Unprocessable Entity` | Resolution Gate validation failed (missing actions, missing resolution summary, or open child tickets) |
| `500 Internal Error` | Unexpected unhandled server exception |
