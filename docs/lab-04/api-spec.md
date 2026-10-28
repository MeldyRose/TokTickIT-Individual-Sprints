# Lab 4 REST API Specification

## 1. Overview & Security Architecture

### 1.1 Authentication & Session Handling
- **Session Mechanism:** Relies on HTTP-only cookie (`toktickit_session`) or Bearer token established in Lab 3.
- **Role Enforcement:** Server-side RBAC middleware validates user role prior to executing route handlers.
- **Error Responses:** Unauthenticated requests return `401 Unauthorized`. Requests by unauthorized roles return `403 Forbidden` with no sensitive metadata disclosed.

### 1.2 Concurrency & Stale Update Protection
Endpoints supporting mutations (`PATCH /api/tickets/:id/status`, `PATCH /api/tickets/:id/owner`, `PATCH /api/tickets/:id/actions/:actionId`) support optimistic concurrency control:
- Clients supply `expectedUpdatedAt` (ISO-8601 string) in the request body.
- If the current database record's `updatedAt` is newer than `expectedUpdatedAt`, the server rejects the mutation with HTTP `409 Conflict` (code `STALE_UPDATE`).

### 1.3 Unified Error Envelope
All error responses return a standardized JSON envelope:
```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | INVALID_INPUT | NOT_FOUND | CONFLICT | STALE_UPDATE | RESOLUTION_GATE_FAILED | INTERNAL_ERROR",
    "message": "Human readable summary of the error.",
    "details": [
      {
        "field": "followUpNote",
        "issue": "Follow-up note is required when followUpRequired is true."
      }
    ]
  }
}
```

---

## 2. Actions Taken Endpoints

### 2.1 List Actions Taken
Retrieve all recorded Actions Taken lines for a specific ticket in chronological order.

- **Method:** `GET`
- **Path:** `/api/tickets/:id/actions`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`, `REQUESTER` (strictly scoped to owned tickets)
- **Authorization Scoping:**
  - `IT_STAFF` and `ADMINISTRATOR` can view actions for any ticket.
  - `REQUESTER` can view actions **if and only if** `ticket.requesterId === currentUser.id`. If requested by a Requester on an unowned ticket, the server returns `403 Forbidden` or `404 Not Found`.
- **Success Response (`200 OK`):**
```json
{
  "ticketId": "cuid_ticket_123",
  "actions": [
    {
      "id": "cuid_action_001",
      "ticketId": "cuid_ticket_123",
      "actionDateTime": "2026-10-28T09:15:00.000Z",
      "description": "Connected console cable to Switch-SW02. Tested interface Gi0/24 and observed packet loss.",
      "result": "Identified physical layer CRC errors occurring on the SFP transceiver module.",
      "performedBy": {
        "id": "cuid_user_alex",
        "name": "Alex Thompson",
        "email": "alex.thompson@toktickit.com",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Procure replacement 10G-SR SFP module from hardware storage.",
      "attachmentNotes": "wireshark_capture_port24.pcapng",
      "createdAt": "2026-10-28T09:15:00.000Z",
      "updatedAt": "2026-10-28T09:20:00.000Z"
    },
    {
      "id": "cuid_action_002",
      "ticketId": "cuid_ticket_123",
      "actionDateTime": "2026-10-28T10:45:00.000Z",
      "description": "Replaced SFP optical transceiver module in Slot 1 and re-seated fiber optic patch lead.",
      "result": "Interface link established immediately at 10 Gbps with zero frame errors.",
      "performedBy": {
        "id": "cuid_user_lisa",
        "name": "Lisa Martinez",
        "email": "lisa.martinez@toktickit.com",
        "role": "IT_STAFF"
      },
      "followUpRequired": false,
      "followUpNote": null,
      "attachmentNotes": null,
      "createdAt": "2026-10-28T10:45:00.000Z",
      "updatedAt": "2026-10-28T10:45:00.000Z"
    }
  ],
  "totalActions": 2
}
```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Requester attempting to view actions on a ticket owned by another user.
  - `404 Not Found`: Ticket does not exist.

---

### 2.2 Create Action Taken
Record a new Action Taken line on a ticket. Records the authenticated user as the performer.

- **Method:** `POST`
- **Path:** `/api/tickets/:id/actions`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Request Body:**
```json
{
  "actionDateTime": "2026-10-28T09:15:00.000Z",
  "description": "Connected console cable to Switch-SW02. Tested interface Gi0/24 and observed packet loss.",
  "result": "Identified physical layer CRC errors occurring on the SFP transceiver module.",
  "followUpRequired": true,
  "followUpNote": "Procure replacement 10G-SR SFP module from hardware storage.",
  "attachmentNotes": "wireshark_capture_port24.pcapng",
  "claimTicket": false
}
```
- **Validation Rules:**
  - `actionDateTime` *(string, ISO date, optional)*: Defaults to current timestamp if omitted.
  - `description` *(string, required)*: Length 10 to 2,000 characters.
  - `result` *(string, required)*: Length 3 to 500 characters.
  - `followUpRequired` *(boolean, required)*: Default `false`.
  - `followUpNote` *(string, conditional)*: Mandatory if `followUpRequired === true` (5 to 1,000 characters). Must be null/empty if `followUpRequired === false`.
  - `attachmentNotes` *(string, optional)*: Maximum 500 characters.
  - `claimTicket` *(boolean, optional)*: If `true` and ticket is unassigned, sets `ticket.ownerId` to authenticated user.
- **Success Response (`201 Created`):**
```json
{
  "action": {
    "id": "cuid_action_001",
    "ticketId": "cuid_ticket_123",
    "actionDateTime": "2026-10-28T09:15:00.000Z",
    "description": "Connected console cable to Switch-SW02. Tested interface Gi0/24 and observed packet loss.",
    "result": "Identified physical layer CRC errors occurring on the SFP transceiver module.",
    "performedBy": {
      "id": "cuid_user_alex",
      "name": "Alex Thompson",
      "email": "alex.thompson@toktickit.com",
      "role": "IT_STAFF"
    },
    "followUpRequired": true,
    "followUpNote": "Procure replacement 10G-SR SFP module from hardware storage.",
    "attachmentNotes": "wireshark_capture_port24.pcapng",
    "createdAt": "2026-10-28T09:15:00.000Z",
    "updatedAt": "2026-10-28T09:15:00.000Z"
  },
  "ticketOwnerId": "cuid_user_alex"
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing required fields or follow-up note omitted when `followUpRequired = true`.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user is a Requester.
  - `404 Not Found`: Ticket does not exist.

---

### 2.3 Update Action Taken
Update an existing Action Taken record. Supports optimistic concurrency control.

- **Method:** `PATCH`
- **Path:** `/api/tickets/:id/actions/:actionId`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Request Body:**
```json
{
  "description": "Connected console cable to Switch-SW02. Tested interface Gi0/24 and verified replacement SFP.",
  "result": "Link stable; verified zero packet loss across 10,000 echo requests.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "final_ping_test.log",
  "expectedUpdatedAt": "2026-10-28T09:15:00.000Z"
}
```
- **Validation Rules:** Same field validation constraints as create. If `expectedUpdatedAt` does not match record's current `updatedAt`, returns `409 Conflict`.
- **Success Response (`200 OK`):**
```json
{
  "action": {
    "id": "cuid_action_001",
    "ticketId": "cuid_ticket_123",
    "actionDateTime": "2026-10-28T09:15:00.000Z",
    "description": "Connected console cable to Switch-SW02. Tested interface Gi0/24 and verified replacement SFP.",
    "result": "Link stable; verified zero packet loss across 10,000 echo requests.",
    "performedBy": {
      "id": "cuid_user_alex",
      "name": "Alex Thompson"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "final_ping_test.log",
    "createdAt": "2026-10-28T09:15:00.000Z",
    "updatedAt": "2026-10-28T10:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Invalid payload or length violation.
  - `401 Unauthorized`: Missing session.
  - `403 Forbidden`: Requester role.
  - `404 Not Found`: Ticket or action not found.
  - `409 Conflict`: Stale update detected (`expectedUpdatedAt` mismatch).

---

## 3. Status Workflow & Resolution Gate Endpoint

### 3.1 Update Ticket Status
Update ticket status per the permitted state machine. If target status is `RESOLVED` or `CLOSED`, enforces the **Resolution Gate**.

- **Method:** `PATCH`
- **Path:** `/api/tickets/:id/status`
- **Permitted Roles:**
  - `IT_STAFF`, `ADMINISTRATOR`: All permitted transitions.
  - `REQUESTER`: Permitted only to signal resolution (`WAITING_FOR_REQUESTER`). Direct resolution is rejected (`403 Forbidden`).
- **Request Body (Standard Transition):**
```json
{
  "status": "IN_PROGRESS",
  "expectedUpdatedAt": "2026-10-28T08:00:00.000Z"
}
```
- **Request Body (Resolution Transition with Resolution Gate Fields):**
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Replaced faulty SFP transceiver on Switch-SW02 port Gi0/24 and verified network connectivity restored.",
  "expectedUpdatedAt": "2026-10-28T08:00:00.000Z"
}
```

#### 3.1.1 Resolution Gate Verification Logic
When `status === 'RESOLVED'`:
1. **Actions Taken Check:** Evaluates `actionsTaken.length >= 1`.
2. **Resolution Summary Check:** Evaluates `resolutionSummary` is non-empty and length $\ge 10$ characters.

#### 3.1.2 Success Response (`200 OK`)
```json
{
  "id": "cuid_ticket_123",
  "ticketNumber": "TCK-2026-0040",
  "currentStatus": "RESOLVED",
  "resolvedAt": "2026-10-28T11:00:00.000Z",
  "closedAt": null,
  "resolutionSummary": "Replaced faulty SFP transceiver on Switch-SW02 port Gi0/24 and verified network connectivity restored.",
  "updatedAt": "2026-10-28T11:00:00.000Z"
}
```

#### 3.1.3 Resolution Gate Failure Response (`422 Unprocessable Entity`)
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
      }
    ]
  }
}
```

#### 3.1.4 Concurrency Conflict Response (`409 Conflict`)
```json
{
  "error": {
    "code": "STALE_UPDATE",
    "message": "Ticket has been modified by another user. Please reload latest changes.",
    "currentUpdatedAt": "2026-10-28T09:45:00.000Z"
  }
}
```

---

## 4. Operational Dashboard Endpoints

### 4.1 Staff Operations Dashboard Metrics
Retrieve KPI metrics, engineer workload ("Owned by Me"), and Recent Tickets.

- **Method:** `GET`
- **Path:** `/api/dashboard/staff`
- **Permitted Roles:** `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (`200 OK`):**
```json
{
  "metrics": {
    "totalOpen": 48,
    "unassigned": 12,
    "ownedByMe": 7,
    "waitingForRequester": 9,
    "urgentOrHigh": 6,
    "resolvedToday": 14,
    "avgResolutionMinutes": 225,
    "avgResolutionFormatted": "3h 45m"
  },
  "recentTickets": [
    {
      "id": "cuid_ticket_123",
      "ticketNumber": "TCK-2026-0040",
      "summary": "Network switch packet loss in Bldg A",
      "requesterName": "Michael Brown",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "ownerName": "Alex Thompson",
      "updatedAt": "2026-10-28T10:00:00.000Z"
    }
  ],
  "calculatedAt": "2026-10-28T10:05:00.000Z",
  "timeWindowDays": 30
}
```

---

### 4.2 Staff Dashboard Queue Breakdown
Retrieve categorical and distribution breakdowns for queue visualization.

- **Method:** `GET`
- **Path:** `/api/dashboard/staff/breakdown`
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
    { "categoryId": "cuid_cat_hw", "categoryName": "Hardware & Equipment", "count": 14, "percentage": 29.2 }
  ]
}
```

---

### 4.3 Requester Dashboard
Retrieve personalized KPI metrics and Recent Ticket Activity for the authenticated Requester.

- **Method:** `GET`
- **Path:** `/api/dashboard/requester`
- **Permitted Roles:** `REQUESTER` (strictly scoped to `currentUser.id`)
- **Success Response (`200 OK`):**
```json
{
  "metrics": {
    "totalActive": 2,
    "waitingForMyInput": 1,
    "resolvedRecently": 5
  },
  "recentActivity": [
    {
      "id": "cuid_ticket_456",
      "ticketNumber": "TCK-2026-0038",
      "summary": "Laptop battery not charging",
      "currentStatus": "WAITING_FOR_REQUESTER",
      "actionRequired": true,
      "updatedAt": "2026-10-28T09:30:00.000Z"
    },
    {
      "id": "cuid_ticket_123",
      "ticketNumber": "TCK-2026-0040",
      "summary": "Network switch packet loss in Bldg A",
      "currentStatus": "IN_PROGRESS",
      "actionRequired": false,
      "updatedAt": "2026-10-28T10:00:00.000Z"
    }
  ],
  "calculatedAt": "2026-10-28T10:05:00.000Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Non-requester accessing requester dashboard endpoint.

---

## 5. HTTP Status Code Catalog & Failure Matrix

| Status Code | Code Meaning | Scenarios / Endpoints |
|---|---|---|
| `200 OK` | Successful retrieval or modification | `GET /api/tickets/:id/actions`, `PATCH /api/tickets/:id/actions/:actionId`, `GET /api/dashboard/staff`, `GET /api/dashboard/requester`, `PATCH /api/tickets/:id/status` (valid) |
| `201 Created` | Entity successfully created | `POST /api/tickets/:id/actions` |
| `400 Bad Request` | Missing required fields, invalid transition, or missing `followUpNote` when `followUpRequired = true` |
| `401 Unauthorized` | Missing authentication cookie or expired session |
| `403 Forbidden` | Requester attempting to create/edit actions, access unowned ticket actions, or access staff dashboard |
| `404 Not Found` | Ticket or action record does not exist |
| `409 Conflict` | Stale update concurrency collision (`expectedUpdatedAt` mismatch) |
| `422 Unprocessable Entity` | Resolution Gate preconditions unsatisfied (`MISSING_ACTION_TAKEN`, `MISSING_RESOLUTION_SUMMARY`) |
| `500 Internal Error` | Unexpected unhandled server exception |
