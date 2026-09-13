# Lab 3 REST API Specification

## 1. Overview & Security Architecture

### 1.1 Authentication & Session Handling
- **Mechanism:** HTTP-only cookie (`toktickit_session` or `auth_token`) or Authorization Bearer header.
- **Password Hashing:** Passwords are hashed using Bcrypt (salt rounds = 10). Plain-text passwords are never logged or stored.
- **Expiration & Invalidation:** Sessions expire after 24 hours of inactivity. Logging out (`POST /api/auth/logout`) invalidates the server session/token immediately.
- **Headers & Caching:** All API responses include `Cache-Control: no-store` to prevent client/proxy caching of sensitive user data.

### 1.2 Authorization & Role-Based Access Control (RBAC)
Endpoints enforce strict role permissions (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) and ownership checks:
- **`401 Unauthorized`**: Request lacks valid authentication credentials.
- **`403 Forbidden`**: Authenticated user role is not permitted, or a Requester attempts to access resources owned by another user (e.g. unowned ticket details, attachments, or Internal Notes).
- **Safe Error Responses**: Information leakage is prevented. Unowned resources or forbidden internal notes return generic `403 Forbidden` or `404 Not Found` without disclosing metadata.

### 1.3 Unified Error Envelope
All error responses return a standard JSON structure:
```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | INVALID_INPUT | NOT_FOUND | DUPLICATE_EMAIL | INVALID_TRANSITION | INTERNAL_ERROR",
    "message": "Human readable error description",
    "details": []
  }
}
```

---

## 2. Authentication & Session Endpoints

### 2.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public (Unauthenticated)
- **Request Body:**
```json
{
  "email": "user@toktickit.com",
  "password": "Password123!"
}
```
- **Success Response (`200 OK`):**
```json
{
  "user": {
    "id": "cuid_user_123",
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "mustChangePassword": false
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid email/password or inactive account.

### 2.2 Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Success Response (`200 OK`):**
```json
{
  "message": "Logged out successfully"
}
```

### 2.3 Current Authenticated User Context
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated
- **Success Response (`200 OK`):**
```json
{
  "user": {
    "id": "cuid_user_123",
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "mustChangePassword": false
  }
}
```
- **Error Responses:** `401 Unauthorized` if session is invalid or expired.

### 2.4 Change Password (Mandatory or Voluntary)
- **Endpoint:** `POST /api/auth/change-password`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!",
  "confirmNewPassword": "NewSecurePassword456!"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "Password updated successfully",
  "mustChangePassword": false
}
```
- **Error Responses:**
  - `400 Bad Request`: Password rules failed (min 8 chars, upper/lower/number/special) or mismatch.
  - `401 Unauthorized`: Current password incorrect.

---

## 3. IT Staff & Shared Ticket Endpoints

### 3.1 Retrieve Ticket List (Queue or Owned)
- **Endpoint:** `GET /api/tickets`
- **Access:** Authenticated (Requester sees owned tickets; IT Staff & Admin see full Ticket Queue)
- **Query Parameters:**
  - `search` (string): Keyword matching ticket number, summary, or description.
  - `category` (string): Filter by Category ID.
  - `system` (string): Filter by Related System ID.
  - `status` (string): Filter by TicketStatus enum (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
  - `priority` (string): Filter by IT Priority enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `owner` (string): Ownership filter (`unassigned`, `me`, or specific user ID).
  - `page` (integer, default `1`): Page number.
  - `pageSize` (integer, default `10`): Items per page.
  - `sortBy` (string, default `createdAt`): Field to sort by (`createdAt`, `itPriority`, `currentStatus`).
  - `sortOrder` (string, default `desc`): Sort direction (`asc` or `desc`).
- **Success Response (`200 OK`):**
```json
{
  "data": [
    {
      "id": "cuid_tkt_001",
      "ticketNumber": "TKT-2026-001234",
      "summary": "Laptop battery drains quickly",
      "category": { "id": "cat_hw", "name": "Hardware" },
      "relatedSystem": { "id": "sys_laptop", "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "IN_PROGRESS",
      "requester": { "id": "u_req_1", "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
      "owner": { "id": "u_staff_1", "name": "Michael Brown", "email": "michael@toktickit.com" },
      "attachmentCount": 2,
      "createdAt": "2026-09-10T08:00:00.000Z",
      "updatedAt": "2026-09-12T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 47,
    "totalPages": 5
  }
}
```

### 3.2 Create Ticket
- **Endpoint:** `POST /api/tickets`
- **Access:** Authenticated (Requester, IT Staff, Admin)
- **Request Body:**
```json
{
  "summary": "Cannot connect to campus VPN",
  "description": "VPN connection drops every 5 minutes when connected from home.",
  "categoryId": "cat_net_01",
  "relatedSystemId": "sys_vpn_01",
  "requestedPriority": "HIGH"
}
```
- **Success Response (`201 Created`):**
```json
{
  "ticket": {
    "id": "cuid_tkt_002",
    "ticketNumber": "TKT-2026-001235",
    "summary": "Cannot connect to campus VPN",
    "description": "VPN connection drops every 5 minutes when connected from home.",
    "requestedPriority": "HIGH",
    "itPriority": "HIGH",
    "currentStatus": "NEW",
    "requesterId": "u_req_1",
    "ownerId": null,
    "createdAt": "2026-09-13T12:00:00.000Z"
  }
}
```

### 3.3 Retrieve Single Ticket Detail
- **Endpoint:** `GET /api/tickets/:id`
- **Access:** Requester (owner only), IT Staff, Admin
- **Success Response (`200 OK`):**
```json
{
  "ticket": {
    "id": "cuid_tkt_001",
    "ticketNumber": "TKT-2026-001234",
    "summary": "Laptop battery drains quickly",
    "description": "Battery loses 80% charge in less than one hour.",
    "category": { "id": "cat_hw", "name": "Hardware" },
    "relatedSystem": { "id": "sys_laptop", "name": "Corporate Laptop" },
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "currentStatus": "IN_PROGRESS",
    "requester": { "id": "u_req_1", "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
    "owner": { "id": "u_staff_1", "name": "Michael Brown", "email": "michael@toktickit.com" },
    "attachments": [
      {
        "id": "att_01",
        "fileName": "battery_diagnostic.png",
        "fileSize": 1048576,
        "mimeType": "image/png",
        "uploadedAt": "2026-09-10T08:05:00.000Z",
        "deletedAt": null
      }
    ],
    "createdAt": "2026-09-10T08:00:00.000Z"
  }
}
```
- **Error Responses:** `403 Forbidden` or `404 Not Found` for unauthorized Requesters.

### 3.4 Claim or Reassign Ticket Ownership
- **Endpoint:** `PATCH /api/tickets/:id/owner`
- **Access:** IT Staff, Admin
- **Request Body:**
```json
{
  "ownerId": "u_staff_2" // or null to unassign, or omitted to claim as self
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "Ticket ownership updated",
  "ticketId": "cuid_tkt_001",
  "owner": {
    "id": "u_staff_2",
    "name": "Sarah Johnson",
    "email": "sarah@toktickit.com"
  }
}
```

### 3.5 Update IT Priority
- **Endpoint:** `PATCH /api/tickets/:id/priority`
- **Access:** IT Staff, Admin
- **Request Body:**
```json
{
  "itPriority": "URGENT"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "IT Priority updated",
  "ticketId": "cuid_tkt_001",
  "itPriority": "URGENT"
}
```

### 3.6 Update Ticket Status
- **Endpoint:** `PATCH /api/tickets/:id/status`
- **Access:** IT Staff, Admin (All permitted transitions), Requester (Problem Appears Resolved action only)
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "comment": "Replaced battery pack under hardware warranty." // Optional status update comment
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "Ticket status updated",
  "ticketId": "cuid_tkt_001",
  "currentStatus": "RESOLVED"
}
```
- **Error Responses:**
  - `400 Bad Request`: Invalid status transition attempt.
  - `403 Forbidden`: Requester trying to set status directly to `RESOLVED` or `CLOSED`.

---

## 4. Public Comments & Role-Restricted Internal Notes

### 4.1 Retrieve Public Comments
- **Endpoint:** `GET /api/tickets/:id/comments`
- **Access:** Requester (owner only), IT Staff, Admin
- **Success Response (`200 OK`):**
```json
[
  {
    "id": "c_pub_01",
    "content": "Thank you for looking into this issue.",
    "author": { "id": "u_req_1", "name": "Jennifer Anderson", "role": "REQUESTER" },
    "createdAt": "2026-09-11T09:00:00.000Z"
  },
  {
    "id": "c_pub_02",
    "content": "We have ordered a replacement battery. Expect delivery by Tuesday.",
    "author": { "id": "u_staff_1", "name": "Michael Brown", "role": "IT_STAFF" },
    "createdAt": "2026-09-11T10:15:00.000Z"
  }
]
```

### 4.2 Post Public Comment
- **Endpoint:** `POST /api/tickets/:id/comments`
- **Access:** Requester (owner only), IT Staff, Admin
- **Request Body:**
```json
{
  "content": "Just confirming that the issue persists after restarting."
}
```
- **Success Response (`201 Created`):**
```json
{
  "id": "c_pub_03",
  "content": "Just confirming that the issue persists after restarting.",
  "author": { "id": "u_req_1", "name": "Jennifer Anderson", "role": "REQUESTER" },
  "createdAt": "2026-09-13T14:20:00.000Z"
}
```

### 4.3 Retrieve Internal Notes (IT Staff & Admin Only)
- **Endpoint:** `GET /api/tickets/:id/notes`
- **Access:** IT Staff, Admin (`403 Forbidden` for Requester)
- **Success Response (`200 OK`):**
```json
[
  {
    "id": "n_int_01",
    "content": "Vendor warranty claim submitted under reference #HW-99482.",
    "author": { "id": "u_staff_1", "name": "Michael Brown", "role": "IT_STAFF" },
    "createdAt": "2026-09-11T10:30:00.000Z"
  }
]
```
- **Error Response for Requester:** `403 Forbidden` (no note content returned).

### 4.4 Post Internal Note (IT Staff & Admin Only)
- **Endpoint:** `POST /api/tickets/:id/notes`
- **Access:** IT Staff, Admin (`403 Forbidden` for Requester)
- **Request Body:**
```json
{
  "content": "Hardware test confirmed battery health at 42% of original capacity."
}
```
- **Success Response (`201 Created`):**
```json
{
  "id": "n_int_02",
  "content": "Hardware test confirmed battery health at 42% of original capacity.",
  "author": { "id": "u_staff_1", "name": "Michael Brown", "role": "IT_STAFF" },
  "createdAt": "2026-09-13T15:00:00.000Z"
}
```

---

## 5. Administrator User Management Endpoints

### 5.1 List Users
- **Endpoint:** `GET /api/admin/users`
- **Access:** Administrator Only
- **Query Parameters:**
  - `search` (string): Keyword matching user name or email.
  - `role` (string): Filter by role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **Success Response (`200 OK`):**
```json
[
  {
    "id": "u_admin_1",
    "name": "Admin User",
    "email": "admin@toktickit.com",
    "role": "ADMINISTRATOR",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T00:00:00.000Z"
  },
  {
    "id": "u_staff_1",
    "name": "Michael Brown",
    "email": "michael@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```

### 5.2 Create User
- **Endpoint:** `POST /api/admin/users`
- **Access:** Administrator Only
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "InitialPassword123!"
}
```
- **Success Response (`201 Created`):**
```json
{
  "user": {
    "id": "u_staff_99",
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-13T16:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (invalid email format, weak initial password, or missing required fields).
  - `409 Conflict`: User email already exists in database.

### 5.3 Edit User Account
- **Endpoint:** `PATCH /api/admin/users/:id`
- **Access:** Administrator Only
- **Request Body:**
```json
{
  "name": "Alexander Thompson",
  "email": "alexander.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true
}
```
- **Success Response (`200 OK`):**
```json
{
  "user": {
    "id": "u_staff_99",
    "name": "Alexander Thompson",
    "email": "alexander.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true,
    "updatedAt": "2026-09-13T16:10:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Attempting to deactivate currently logged-in Admin account or deactivating the system's last active Administrator.
  - `409 Conflict`: New email matches another existing user.

### 5.4 Reset Initial Password
- **Endpoint:** `POST /api/admin/users/:id/reset-password`
- **Access:** Administrator Only
- **Request Body:**
```json
{
  "initialPassword": "NewTempPassword123!"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "Initial password reset successfully",
  "userId": "u_staff_99",
  "mustChangePassword": true
}
```
- **Error Responses:** `400 Bad Request` if initial password fails complexity validation.
