# Lab 2 API Specification

## 1. Overview & Requester Context Scoping

All REST API endpoints in Lab 2 serve the Requester Ticket Management MVP.

### Requester Identity Scoping Header
Because authentication is out of scope for Lab 2, all ticket and attachment endpoints scope requests to the selected Development Requester via a mandatory HTTP header:
- `X-Requester-Id`: `<requester_id_string>`

If `X-Requester-Id` is missing, invalid, or empty on scoped endpoints, the API returns:
- `HTTP 400 Bad Request` — `{"error": "X-Requester-Id header is required"}`

---

## 2. Endpoints Summary Table

| Endpoint ID | HTTP Method | Route Path | Description | Success Status |
|---|---|---|---|---|
| EP-01 | `GET` | `/api/requesters` | Retrieve active Development Requesters (excludes inactive) | `200 OK` |
| EP-02 | `GET` | `/api/categories` | Retrieve active Ticket Categories | `200 OK` |
| EP-03 | `GET` | `/api/related-systems` | Retrieve active Related Systems | `200 OK` |
| EP-04 | `POST` | `/api/tickets` | Create a new validated Ticket for selected Requester | `201 Created` |
| EP-05 | `GET` | `/api/tickets` | Retrieve paginated tickets owned by selected Requester | `200 OK` |
| EP-06 | `GET` | `/api/tickets/:id` | Retrieve details of an owned ticket | `200 OK` |
| EP-07 | `POST` | `/api/tickets/:id/attachments` | Upload an attachment to an owned ticket | `201 Created` |
| EP-08 | `GET` | `/api/attachments/:id/metadata` | Retrieve attachment metadata | `200 OK` |
| EP-09 | `GET` | `/api/attachments/:id/download` | Download active binary attachment file | `200 OK` |
| EP-10 | `DELETE` | `/api/attachments/:id` | Soft-remove attachment with removal reason | `200 OK` |

---

## 3. Detailed Endpoint Contracts

### EP-01: Retrieve Active Development Requesters
**`GET /api/requesters`**

- **Headers:** None (Public reference endpoint for selector)
- **Success Response (`200 OK`):**
  ```json
  [
    { "id": "req-user-001", "name": "Jennifer Anderson", "email": "jennifer.a@example.com" },
    { "id": "req-user-002", "name": "Michael Brown", "email": "michael.b@example.com" },
    { "id": "req-user-003", "name": "David Lee", "email": "david.l@example.com" },
    { "id": "req-user-004", "name": "Sarah Johnson", "email": "sarah.j@example.com" }
  ]
  ```

---

### EP-02: Retrieve Active Categories
**`GET /api/categories`**

- **Headers:** None
- **Success Response (`200 OK`):**
  ```json
  [
    { "id": "cat-acc-001", "name": "Account and Access", "description": "Login, permissions, password resets" },
    { "id": "cat-hwd-002", "name": "Hardware", "description": "Laptops, monitors, peripherals, printers" },
    { "id": "cat-sfw-003", "name": "Software", "description": "Operating system, applications, installation" },
    { "id": "cat-net-004", "name": "Network", "description": "Wi-Fi, VPN, internet connectivity" }
  ]
  ```

---

### EP-03: Retrieve Active Related Systems
**`GET /api/related-systems`**

- **Headers:** None
- **Success Response (`200 OK`):**
  ```json
  [
    { "id": "sys-001", "name": "Email" },
    { "id": "sys-002", "name": "Campus Wi-Fi" },
    { "id": "sys-003", "name": "VPN" },
    { "id": "sys-004", "name": "LEB2 App" },
    { "id": "sys-005", "name": "Grade Submission App" },
    { "id": "sys-006", "name": "Printer" },
    { "id": "sys-007", "name": "Corporate Laptop" }
  ]
  ```

---

### EP-04: Ticket Creation
**`POST /api/tickets`**

- **Headers:** `X-Requester-Id: req-user-001`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "categoryId": "cat-hwd-002",
    "relatedSystemId": "sys-007",
    "requestedPriority": "MEDIUM"
  }
  ```
- **Validation Rules:**
  - `summary`: Required string, 1–255 characters (trimmed).
  - `categoryId`: Required valid category ID.
  - `relatedSystemId`: Required valid related system ID.
  - `requestedPriority`: Optional enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), default `MEDIUM`.
  - `description`: Optional text.
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "tkt-uuid-001",
    "ticketNumber": "TKT-2025-001234",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "categoryId": "cat-hwd-002",
    "relatedSystemId": "sys-007",
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "currentStatus": "NEW",
    "requesterId": "req-user-001",
    "createdAt": "2025-05-12T09:14:00.000Z",
    "updatedAt": "2025-05-12T09:14:00.000Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"error": "Validation failure", "details": ["Summary is required"]}`

---

### EP-05: Paginated Ticket List Retrieval
**`GET /api/tickets`**

- **Headers:** `X-Requester-Id: req-user-001`
- **Query Parameters:**
  - `page`: Integer (default `1`)
  - `limit`: Integer (default `10`, max `50`)
  - `search`: String (searches summary, description, ticketNumber)
  - `categoryId`: String (optional filter)
  - `status`: String (optional filter: `NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  - `relatedSystemId`: String (optional filter)
  - `sortBy`: String (`createdAt`, `requestedPriority`, default `createdAt`)
  - `order`: String (`asc`, `desc`, default `desc`)
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "tkt-uuid-001",
        "ticketNumber": "TKT-2025-001234",
        "summary": "Laptop battery drains quickly",
        "categoryId": "cat-hwd-002",
        "categoryName": "Hardware",
        "relatedSystemId": "sys-007",
        "relatedSystemName": "Corporate Laptop",
        "requestedPriority": "MEDIUM",
        "itPriority": "MEDIUM",
        "currentStatus": "NEW",
        "createdAt": "2025-05-12T09:14:00.000Z",
        "updatedAt": "2025-05-12T09:14:00.000Z",
        "attachmentCount": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

---

### EP-06: Requester-Owned Ticket Detail Retrieval
**`GET /api/tickets/:id`**

- **Headers:** `X-Requester-Id: req-user-001`
- **Behavior:** Verifies ticket exists and `ticket.requesterId == X-Requester-Id`.
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "tkt-uuid-001",
    "ticketNumber": "TKT-2025-001234",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when idle.",
    "categoryId": "cat-hwd-002",
    "category": { "id": "cat-hwd-002", "name": "Hardware" },
    "relatedSystemId": "sys-007",
    "relatedSystem": { "id": "sys-007", "name": "Corporate Laptop" },
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "currentStatus": "NEW",
    "requesterId": "req-user-001",
    "requester": { "id": "req-user-001", "name": "Jennifer Anderson" },
    "createdAt": "2025-05-12T09:14:00.000Z",
    "updatedAt": "2025-05-12T09:14:00.000Z",
    "attachments": [
      {
        "id": "att-uuid-001",
        "fileName": "battery_log.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "uploadedAt": "2025-05-12T09:20:00.000Z",
        "deletedAt": null
      }
    ]
  }
  ```
- **Error Responses:**
  - `404 Not Found` / `403 Forbidden`: `{"error": "Ticket not found or access denied"}`

---

### EP-07: Attachment Upload
**`POST /api/tickets/:id/attachments`**

- **Headers:** `X-Requester-Id: req-user-001`, `Content-Type: multipart/form-data`
- **Form Fields:** `file` (binary)
- **Validation:** File type in (JPG, PNG, WEBP, PDF), size <= 5 MB (5,242,880 bytes), active attachments count < 5.
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "att-uuid-001",
    "ticketId": "tkt-uuid-001",
    "fileName": "battery_log.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-05-12T09:20:00.000Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"error": "File type not permitted or file size exceeds 5MB limit"}`
  - `400 Bad Request`: `{"error": "Maximum active attachments limit (5) reached for this ticket"}`

---

### EP-08: Attachment Metadata Retrieval
**`GET /api/attachments/:id/metadata`**

- **Headers:** `X-Requester-Id: req-user-001`
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "att-uuid-001",
    "ticketId": "tkt-uuid-001",
    "fileName": "battery_log.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-05-12T09:20:00.000Z",
    "deletedAt": null
  }
  ```

---

### EP-09: Attachment Download
**`GET /api/attachments/:id/download`**

- **Headers:** `X-Requester-Id: req-user-001`
- **Behavior:** Returns file stream if attachment belongs to an owned ticket and `deletedAt == null`.
- **Success Response (`200 OK`):**
  - **Headers:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="battery_log.pdf"`
  - **Body:** Binary file stream.
- **Error Responses:**
  - `404 Not Found`: `{"error": "Attachment not found, soft-removed, or access denied"}`

---

### EP-10: Attachment Soft Removal
**`DELETE /api/attachments/:id`**

- **Headers:** `X-Requester-Id: req-user-001`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "removalReason": "Uploaded incorrect log file"
  }
  ```
- **Behavior:** Sets `deletedAt = now()` and stores `removalReason`. Download endpoint blocks soft-removed attachments.
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "att-uuid-001",
    "deletedAt": "2025-05-12T10:00:00.000Z",
    "removalReason": "Uploaded incorrect log file",
    "message": "Attachment soft-removed successfully"
  }
  ```

---

## 4. Expected HTTP Statuses Table

| Status Code | Code Meaning | Example Use Case |
|---|---|---|
| **200** | OK | Successful retrieval of requesters, categories, ticket lists, ticket details, or attachment metadata |
| **201** | Created | Successful creation of a Ticket or successful Attachment upload |
| **400** | Bad Request | Missing required fields, invalid file type, oversized upload (>5MB), exceeding 5 attachment limit |
| **403** | Forbidden | Access attempt to a Ticket or Attachment belonging to another Requester |
| **404** | Not Found | Requested ticket or attachment ID does not exist in database |
| **500** | Internal Server Error | Unexpected server or database exception |

---

## 5. Standard Error JSON Payload Table

| Error Field Name | Data Type | Description |
|---|---|---|
| `error` | String | High-level summary of the error |
| `details` | Array of Strings | Optional list of specific validation or error failure reasons |
