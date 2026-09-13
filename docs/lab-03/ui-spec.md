# Lab 3 UI Specification

## 1. Zen Green Design System & Theme Foundations

Lab 3 reuses and extends the **Zen Green** design language established in Lab 2. All screens, cards, forms, tables, modals, badges, and feedback components must strictly utilize Zen Green design tokens.

### 1.1 Color Tokens
- **Primary Green:** `#006B3C` (Primary actions, active tab indicators, header backgrounds, main buttons)
- **Primary Hover / Dark Green:** `#0B7A46` / `#004D2B` (Button hover/focus states, active navigation links)
- **Pale / Tint Green:** `#EAF6EF` (Light table row highlights, background cards, active tab pills, badge backgrounds)
- **Quiet App Background:** `#F5F7F6` (Main screen background, card container backing)
- **Text Primary:** `#1A1D1C` (Headings, primary form labels, body text)
- **Text Muted:** `#5A625E` (Help text, timestamps, table header titles)
- **Border / Divider:** `#D8E0DC` (Form borders, card dividers, table grid lines)

### 1.2 Status & Priority Badges
Badges use consistent, accessible non-color indicators (icons/text) alongside standard color fills:
- **Status Badges:**
  - `NEW`: Soft Blue (`#E3F2FD`, Text `#0D47A1`)
  - `OPEN` / `IN_PROGRESS`: Amber / Green Tint (`#FFF8E1` / `#E8F5E9`, Text `#E65100` / `#1B5E20`)
  - `WAITING_FOR_REQUESTER`: Purple Tint (`#F3E5F5`, Text `#4A148C`)
  - `RESOLVED` / `CLOSED`: Soft Slate / Dark Green (`#ECEFF1` / `#E0F2F1`, Text `#37474F` / `#004D40`)
  - `REOPENED`: Orange Tint (`#FBE9E7`, Text `#BF360C`)
  - `CANCELLED`: Neutral Gray (`#EEEEEE`, Text `#616161`)
- **Priority Badges:**
  - `LOW`: Light Gray (`#F5F5F5`, Text `#616161`)
  - `MEDIUM`: Light Yellow (`#FFFDE7`, Text `#F57F17`)
  - `HIGH`: Light Orange (`#FFF3E0`, Text `#E65100`)
  - `URGENT`: Light Red (`#FFEBEE`, Text `#C62828`)
- **Role Badges:**
  - `Requester`: Light Teal (`#E0F2F1`, Text `#004D40`)
  - `IT Staff`: Deep Green Tint (`#E8F5E9`, Text `#1B5E20`)
  - `Administrator`: Soft Purple (`#EDE7F6`, Text `#4A148C`)

---

## 2. Navigation & App Shell Structure

### 2.1 Header Bar Architecture
- **Logo Area:** "TokTickIT" branding with Zen Green clock/ticket icon.
- **Role-Based Navigation Items:**
  - *Requester View:* `My Tickets` | `Create Ticket`
  - *IT Staff View:* `Ticket Queue` | `Create Ticket`
  - *Administrator View:* `User Management`
- **Authenticated User Widget (Top Right):**
  - Displays User Full Name and Role Badge (e.g. `Michael Brown` `[IT Staff]`).
  - Profile dropdown trigger containing:
    - User email address
    - "Change Password" action link
    - "Logout" primary action button

---

## 3. Screen Specifications

### 3.1 Login Screen (`/login`)
- **Layout:** Centered single card layout (max-width `440px`) on quiet background (`#F5F7F6`).
- **Header:** TokTickIT logo and "Sign in to your account" subtitle.
- **Form Controls:**
  - `Email address` input field (type `email`, required, autofocus).
  - `Password` input field (type `password`, toggleable show/hide password icon).
  - Primary button: `Sign In` (Zen Green `#006B3C`, full width).
- **Validation & Failure Feedback:**
  - Empty field validation displayed immediately below input fields upon submit attempt.
  - Invalid credentials or inactive account: Safe red alert banner (`#FFEBEE`, border `#FFCDD2`) stating: `"Invalid email or password. Please try again."`
  - Busy state: Spinner indicator and disabled `Sign In` button during API request.

### 3.2 Mandatory Password Change Screen (`/change-password`)
- **Layout:** Modal overlay or dedicated screen blocking access to normal navigation.
- **Header:** "Change Your Password" title with message: *"You must change your password to continue."*
- **Form Controls:**
  - `Current (temporary) password` input.
  - `New password` input with live validation checklist:
    - `✓ At least 8 characters`
    - `✓ Include upper and lower case letters`
    - `✓ Include a number and a special character`
  - `Confirm new password` input.
  - Primary button: `Save New Password & Continue` (full width, Zen Green).
- **Behavior:** On successful password update, `mustChangePassword` is set to `false`, and user is automatically routed to their role-default landing screen (`My Tickets`, `Ticket Queue`, or `User Management`).

### 3.3 Requester Ticket Detail & Public Collaboration (`/tickets/:id`)
- **Layout:** Reuses Lab 2 layout with two major functional additions:
  1. **"Problem Appears Resolved" Action Button:** Rendered in header control area when ticket is in an active status (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`). Clicking prompts confirmation before submitting a status change to request formal closure.
  2. **Public Comments Section:** Located below ticket description and attachments.
     - Comment thread listing chronological comments with author avatar initials, author name, role badge, timestamp, and comment body.
     - "Add Public Comment" form area with multiline textarea, character counter (max 2,000 chars), and `Post Comment` button.
- **Security Scoping:** Internal Notes section is **completely excluded** from DOM rendering for Requesters.

### 3.4 IT Staff Ticket Queue (`/staff/tickets`)
- **Layout:** Full-width operational dashboard layout.
- **Control Bar (Top):**
  - Search input with magnify icon (`Search by ticket number or summary...`).
  - Category filter dropdown.
  - Status filter dropdown.
  - IT Priority filter dropdown.
  - Ownership filter toggle: `All Tickets` | `Unassigned` | `Assigned to Me`.
  - Sort dropdown (`Created Date (Newest)`, `Created Date (Oldest)`, `IT Priority (Highest)`).
  - `Clear Filters` secondary text button.
- **Content Area:**
  - *Desktop (>=992px):* Multi-column table displaying columns: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Req. Priority`, `IT Priority`, `Status`, `Owner`, `Actions`. Hover highlight on table rows.
  - *Mobile (<768px):* Stacked card list displaying ticket summary, status badge, priority badge, owner avatar, and "View Detail" button.
- **Pagination Bar (Bottom):** Items counter (`Showing 1 to 10 of 87 tickets`), previous/next page buttons, and active page pill.

### 3.5 IT Staff Ticket Detail (`/staff/tickets/:id`)
- **Layout:** Two-column split layout on desktop:
  - **Left Column (Ticket Info & Metadata):** Ticket No., Category, Related System, Requester Name, Requested Priority, Summary, Description, and Attachments list with upload/download actions.
  - **Right Column (Operational Controls):**
    - `Ticket Owner` control: Displays current owner or "Unassigned". Features `Claim Ticket` quick button and `Reassign` staff selector.
    - `IT Priority` dropdown (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
    - `Current Status` dropdown displaying permitted status transition choices per BR-14.
- **Collaboration Tabs / Sections:**
  - **Public Comments Tab / Section:** Styled with light green border/header. Visible to Requester and IT Staff. Displays public comment thread and posting form.
  - **Internal Notes Tab / Section:** Styled with light amber/yellow background (`#FFFDE7`) and dark amber border (`#FFE082`). Features prominent lock icon and badge: `🔒 Internal Notes (IT Staff & Admin Only)`. Thread listing and post note form.

### 3.6 Administrator User Management (`/admin/users`)
- **Layout:** Dedicated single-page admin panel.
- **Header:** "Users" page title with `+ Create User` primary Zen Green button.
- **Control Bar:** Search input (`Search users by name or email...`) and Role filter dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
- **User List Table:**
  - Columns: `Name`, `Email`, `Role` (with role badge), `Status` (Active green pill / Inactive red pill), `Actions` (`Edit`, `Reset Password`).
- **Modal Dialogs:**
  - **Create User Modal:** Inputs for Full Name, Email Address, Role selection (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), Active toggle switch, and Initial Password input.
  - **Edit User Modal:** Inputs for Full Name, Email Address, Role selection, and Active toggle switch. Disables deactivating own account or last active administrator.
  - **Reset Initial Password Modal:** Input for New Initial Password with validation rules. Info note: *"User will be forced to change this password on next login."*

---

## 4. Screen Modes & User Feedback Matrix

| State / Condition | Trigger Event | Visual Feedback & Component Behavior |
|---|---|---|
| **Loading / Busy** | Initial data fetch or form submission | Skeleton loader cards/rows or button spinner state with disabled interaction. |
| **Validation Error** | Submitting form with invalid/missing inputs | Red border around input field, focus moved to first error, inline error message below field. |
| **Empty State** | User has no tickets, or no users exist | Centered icon with quiet message (e.g. *"No tickets found"*), and primary creation action button. |
| **No-Results State** | Search query or filter matches 0 items | Message: *"No tickets match your filter criteria."* with prominent `Clear Filters` button. |
| **Forbidden (403)** | Non-admin accessing admin route, or Requester attempting unowned ticket access | Full-page Zen Green callout card stating: *"403 Access Denied. You do not have permission to view this page."* with return link. |
| **Success Toast** | Saved password, updated status, created user | Top-right Zen Green toast banner: `"User account created successfully"` auto-dismissing after 4 seconds. |
| **Conflict (409)** | Creating user with existing email | Inline error banner: `"A user account with this email address already exists."` |

---

## 5. Responsive & Accessibility Rules

### 5.1 Breakpoint Layout Rules
- **Desktop (>=992px):** Multi-column data tables for IT Staff Queue and User Management; side-by-side split view for Ticket Detail controls.
- **Tablet (768px - 991px):** Two-column form layouts adapt to single column; tables compress padding; search/filter controls stack into 2 rows.
- **Mobile (<768px):** All form controls stack vertically; tables transform into full-width stacked card components; top bar navigation collapses into responsive drawer/hamburger menu. Zero horizontal scrolling.

### 5.2 Accessibility Expectations
- **Keyboard Focus:** All interactive elements (buttons, inputs, dropdowns, table row links) have visible 2px green focus rings (`#006B3C`) on keyboard `Tab` navigation.
- **ARIA Attributes:** Modals utilize `role="dialog"` and `aria-modal="true"`; status badges include `aria-label`; error messages use `aria-live="polite"`.
- **Color Contrast:** Text-to-background contrast ratios strictly meet WCAG AA standards (minimum 4.5:1 ratio for body text).
