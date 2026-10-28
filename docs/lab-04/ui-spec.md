# Lab 4 UI Specification

## 1. Zen Green Design System & Theme Foundations

Lab 4 maintains visual continuity with the **Zen Green** design language established in Lab 2 and Lab 3 while introducing new operational interfaces: Dual Dashboards (Staff & Requester), Editable Actions Taken Timelines, Resolution Gate Dialogs, and Concurrency Conflict Alerts.

### 1.1 Color Tokens
- **Primary Zen Green:** `#006B3C` (Primary actions, active tab headers, brand accents)
- **Primary Hover / Focus:** `#0B7A46` / `#004D2B` (Hover states, active navigation pills, focus outlines)
- **Pale / Tint Green:** `#EAF6EF` (Active tab fills, success callouts, metric card subtle highlights)
- **Quiet App Background:** `#F5F7F6` (Main canvas background, dashboard backing)
- **Surface White:** `#FFFFFF` (Card interiors, modal dialogs, data tables)
- **Text Primary:** `#1A1D1C` (Headings, primary form labels, metric values)
- **Text Muted:** `#5A625E` (Subtitles, timestamps, unit indicators, table headers)
- **Border / Divider:** `#D8E0DC` (Card borders, dividers, subtle gridlines)

### 1.2 Metric & Contextual Status Accents
- **Open / Backlog Accent:** `#0288D1` (Soft Blue — Total Open metric card accent, `NEW` badge)
- **Unassigned / Warning Accent:** `#ED6C02` (Amber/Orange — Unassigned card accent, `UNASSIGNED` pill)
- **Owned by Me Accent:** `#006B3C` (Zen Green — Owned by Me card accent, staff badge)
- **Waiting for Requester / Input Accent:** `#7B1FA2` (Purple — Waiting card accent, `WAITING_FOR_REQUESTER` pill)
- **Urgent / High Accent:** `#D32F2F` (Crimson Red — Urgent card accent, `URGENT` badge)
- **Resolved / Success Accent:** `#2E7D32` (Forest Green — Resolved Today card accent, `RESOLVED` pill)
- **Duration / Time Accent:** `#37474F` (Slate Gray — Avg Resolution Time card accent, duration chips)

### 1.3 Follow-up & Action Indicators
- **Follow-up Required Badge:** Amber badge (`#FFF8E1`, text `#E65100`, icon `⚠️ Follow-up Required`)
- **No Follow-up Needed Badge:** Soft gray badge (`#F5F5F5`, text `#616161`, icon `✓ No Follow-up`)
- **Attachment Notes Tag:** Pale Blue chip (`#E1F5FE`, text `#0277BD`, icon `📎 Attachment Notes`)

---

## 2. Navigation & App Shell Updates

The header navigation dynamically reflects the authenticated role:
- **Requester View:** `Dashboard` *(New in Lab 4)* | `My Tickets` | `Create Ticket`
- **IT Staff View:** `Dashboard` *(New in Lab 4)* | `Ticket Queue` | `Create Ticket`
- **Administrator View:** `Dashboard` *(New in Lab 4)* | `Ticket Queue` | `User Management`
- **User Widget (Top Right):** Displays user name, role badge, profile menu with "Change Password", and "Logout".

---

## 3. Screen Specifications

### 3.1 Staff Operations Dashboard (`/staff/dashboard`)

#### 3.1.1 Overview & Header
- **Page Title:** "Operations Dashboard"
- **Subtitle:** "Real-time queue health, engineer workload, and team resolution velocity."
- **Controls:** "Refresh" button (with sync spinner) and "View All Queue" button (navigates to `/staff/tickets`).

#### 3.1.2 KPI Metric Cards Grid
Displays 7 high-impact cards in a responsive CSS grid (`grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`):

| Metric Card | Accent Color | Figure | Subtitle / Trend | Drill-Down Target Route |
|---|---|---|---|---|
| **Total Open** | `#0288D1` (Blue) | Numeric (e.g. `48`) | "Active queue backlog" | `/staff/tickets?status=open` |
| **Unassigned** | `#ED6C02` (Amber) | Numeric (e.g. `12`) | "Awaiting assignment" | `/staff/tickets?ownership=unassigned` |
| **Owned by Me** | `#006B3C` (Green) | Numeric (e.g. `7`) | "Assigned to your queue" | `/staff/tickets?ownership=me` |
| **Waiting for Requester** | `#7B1FA2` (Purple) | Numeric (e.g. `9`) | "Awaiting user feedback" | `/staff/tickets?status=WAITING_FOR_REQUESTER` |
| **Urgent / High** | `#D32F2F` (Red) | Numeric (e.g. `6`) | "Requires immediate triage" | `/staff/tickets?priority=URGENT,HIGH&status=open` |
| **Resolved Today** | `#2E7D32` (Green) | Numeric (e.g. `14`) | "Remediated since midnight" | `/staff/tickets?status=RESOLVED&resolvedRange=today` |
| **Avg Resolution Time** | `#37474F` (Slate) | Formatted (e.g. `3h 45m`) | "Last 30-day average" | `/staff/tickets?status=RESOLVED` |

#### 3.1.3 Metric Card Visual Specifications
- White background (`#FFFFFF`), `1px solid #D8E0DC` border, `8px` border radius, `5px solid <Accent>` left border.
- Hover elevation (`transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.08)`).
- Clear keyboard focus outline (`2px solid #006B3C`).

#### 3.1.4 Recent Tickets Table
A streamlined table below the metric grid listing the 10 most recently updated tickets:
- **Columns:** `Ticket No.`, `Summary`, `Requester`, `Priority` (badge), `Status` (badge), `Owner`, `Last Updated`, `Action` ("View Detail" link).
- Hover highlight on table rows; row click navigates to `/staff/tickets/:id`.

#### 3.1.5 Queue Distribution Breakdown Widgets
- **Status Distribution:** Segmented horizontal bar showing breakdown of open tickets across `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`.
- **Category Breakdown:** Horizontal bar list showing tickets grouped by system category.

---

### 3.2 Requester Dashboard (`/dashboard`)

#### 3.2.1 Overview & Header
- **Page Title:** "My IT Support Dashboard"
- **Subtitle:** "Track the progress of your IT support tickets and pending requests."
- **Primary Action (Top Right):** `+ Create New Ticket` (primary Zen Green button).

#### 3.2.2 Requester Metric Cards Grid
Displays 3 focused metric cards in a responsive grid:

| Metric Card | Accent Color | Figure | Description | Drill-Down Target Route |
|---|---|---|---|---|
| **Active Tickets** | `#0288D1` (Blue) | Numeric (e.g. `2`) | "Tickets currently being worked on" | `/tickets?status=active` |
| **Waiting for My Input** | `#ED6C02` (Amber) | Numeric (e.g. `1`) | "IT Staff is waiting for your reply" | `/tickets?status=WAITING_FOR_REQUESTER` |
| **Resolved Recently** | `#006B3C` (Green) | Numeric (e.g. `5`) | "Tickets resolved in the last 7 days" | `/tickets?status=RESOLVED` |

#### 3.2.3 Requester Action Callout & Recent Activity List
- **Action Required Banner:** If `Waiting for My Input > 0`, displays a prominent amber alert card:
  - *"IT Staff is waiting for your response on 1 ticket. Please review the ticket details to provide the requested information."* Includes direct link to the affected ticket.
- **Recent Ticket Activity Table:**
  - Columns: `Ticket No.`, `Summary`, `Status` (badge), `Last Updated`, `Actions` ("View Details" link).

---

### 3.3 Actions Taken Activity Feed & Form (`/staff/tickets/:id` & `/tickets/:id`)

#### 3.3.1 Section Architecture
- Placed on the Ticket Detail screen as a dedicated tab or prominent workbench panel: `[ Public Comments ] [ 🔒 Internal Notes ] [ 🛠️ Actions Taken (N) ]`.
- Header displays: "Actions Taken" title, action counter pill, and `+ Log Action Taken` primary button (visible to IT Staff and Admin only).

#### 3.3.2 Action Card Layout
Chronological timeline cards connecting sequential action items:
- **Header Row:**
  - Date & Time display: Formatted local date and time (`Oct 28, 2026, 09:15 AM`) with relative elapsed pill (`"2 hours ago"`).
  - Performer attribution: User name and role pill (`Alex Thompson [IT Staff]`).
  - Follow-up status badge: `⚠️ Follow-up Required` (amber) or `✓ No Follow-up` (gray).
  - Edit Action control (Staff/Admin only): "Edit" button (`✏️ Edit Action`) in top right.
- **Body Row:**
  - **Description:** Clear technical text describing steps performed.
  - **Result:** Result callout block (`background: #F5F7F6; border-left: 3px solid #006B3C; padding: 8px 12px`) displaying the observed outcome.
  - **Follow-up Note (if applicable):** Amber callout (`background: #FFF8E1; border-left: 3px solid #ED6C02`) displaying the pending follow-up action.
  - **Attachment Notes (if applicable):** Subtle footnote displaying reference files or diagnostics (`📎 Attachment Notes: wireshark_trace_port24.pcapng`).

#### 3.3.3 Requester View on Actions Taken
- Requesters viewing their own ticket (`/tickets/:id`) see the **exact same chronological feed** of Actions Taken.
- Requesters can inspect the technical steps and results so they understand remediation progress.
- All "Log Action Taken" and "Edit Action" buttons are completely absent from DOM for Requesters.

#### 3.3.4 Create / Edit Action Taken Modal Dialog
- **Modal Title:** "Log Action Taken" (or "Edit Action Taken")
- **Form Controls:**
  - `Action Date/Time` (datetime-local picker, required): Defaults to current local date/time.
  - `Description` (textarea, required, min 10 chars, max 2000 chars): Detailed description of technical action executed.
  - `Result` (input/textarea, required, min 3 chars, max 500 chars): Observed result or outcome of the action.
  - `Follow-Up Required?` (toggle switch, boolean): Defaults to `false`.
  - `Follow-up Note` (textarea, conditionally required if toggle is checked, min 5 chars, max 1000 chars): Appears dynamically with an asterisk `*` when toggle is enabled.
  - `Attachment Notes` (input text, optional, max 500 chars): Reference file names or diagnostic notes.
  - `Claim Ticket` (checkbox, rendered only on create when ticket is unassigned): "Assign this ticket to me".
- **Validation:** Live error messages appear below fields if required conditions or character lengths are violated.
- **Action Buttons:** "Cancel" and "Save Action Taken" (Zen Green primary).

---

### 3.4 Resolution Gate Modal Dialog

#### 3.4.1 Trigger
When an IT Staff or Admin user updates the status dropdown on Ticket Detail to `RESOLVED`, the system triggers the **"Confirm Ticket Resolution"** modal dialog.

#### 3.4.2 Precondition Verification Checklist
The modal runs real-time verification and presents a visual checklist:
1. **Actions Taken Prerequisite:**
   - If `actionsCount >= 1`: Green checkmark (`✓ At least 1 Action Taken recorded (N logged)`).
   - If `actionsCount === 0`: Red warning (`✕ No Actions Taken logged. At least one action must be recorded before resolving.`) with a quick link `[+ Log Action Taken]`.
2. **Resolution Summary Input:**
   - Label: "Resolution Summary / Remediation Notes *"
   - Textarea (required, min 10 characters, max 2000 characters).
   - Placeholder: *"Describe the root cause and the specific resolution steps performed to solve this issue..."*
   - Live character counter: `"45 / 2000 characters"`. Shows `"Minimum 10 characters required"` until satisfied.

#### 3.4.3 Submission & Confirmation Behavior
- The "Confirm & Resolve Ticket" button is **disabled** until both checklist criteria are met.
- On submit, a loading spinner is displayed.
- On success: Modal closes, top-right Zen Green toast banner confirms `"Ticket resolved successfully"`, and status badge updates to `RESOLVED`.
- On gate failure (`422 Unprocessable Entity`): Displays an inline red alert banner detailing the exact unmet preconditions.

---

### 3.5 Optimistic Concurrency Conflict Alert Modal

- **Trigger:** Server returns HTTP `409 Conflict` (code `STALE_UPDATE`) when saving ticket status or editing an Action Taken.
- **Visual Design:** Warning modal with amber heading (`⚠️ Update Conflict`).
- **Message:** *"This record was updated by another user while you were editing. To prevent overwriting their changes, your update was not saved."*
- **Action Buttons:**
  - `Reload Latest Changes` (Zen Green primary — refetches current ticket state and updates the screen).
  - `Dismiss` (closes modal).

---

## 4. Screen Modes & User Feedback Matrix

| State / Condition | Trigger Event | Visual Feedback & Component Behavior |
|---|---|---|
| **Loading / Busy** | Fetching dashboard metrics or saving actions | Shimmer skeleton cards on dashboard; submit buttons show spinner and disable. |
| **Validation Error** | Missing required fields or length violation | Red border on input, inline error text below field (`aria-live="polite"`). |
| **Follow-up Note Missing** | Follow-up toggle enabled without note | Field highlights red with error: `"Follow-up note is required when follow-up is checked."` |
| **Gate Rejection (422)** | Attempting resolution without action or summary | Inline red alert banner in modal listing missing prerequisites. |
| **Conflict (409)** | Stale update concurrency collision | Concurrency alert modal prompting user to reload latest changes. |
| **Forbidden (403)** | Requester attempting to log/edit actions | Access Denied callout card with return link. |
| **Success Toast** | Action logged, action edited, ticket resolved | Top-right Zen Green toast banner auto-dismissing after 4 seconds. |

---

## 5. Responsive Breakpoints & Accessibility (WCAG AA)

### 5.1 Responsive Layout Rules
- **Desktop ($\ge 992\text{px}$):**
  - Staff Dashboard: 3-column / 4-column metric card grid. Recent Tickets table displays all columns.
  - Requester Dashboard: 3-column metric grid.
  - Ticket Detail: Multi-column workbench layout with side-by-side feed and controls.
- **Tablet ($768\text{px} - 991\text{px}$):**
  - Staff Dashboard: 2-column metric grid. Recent Tickets table compresses padding.
  - Requester Dashboard: 2-column metric grid (third card wraps to full width).
- **Mobile ($< 768\text{px}$):**
  - Dashboards: 1-column full-width stacked metric cards.
  - Recent Tickets & Actions Feed: Tables convert into full-width stacked cards.
  - Modals: Full-screen overlay on mobile with fixed bottom action buttons.
  - Zero horizontal page scrolling.

### 5.2 Accessibility Expectations
- **Keyboard Navigation:** All metric cards, action items, and modal controls are reachable via `Tab` with a visible `2px solid #006B3C` focus ring.
- **Screen Reader Support:** Metric cards have descriptive `aria-label`s; status badges include `role="status"`.
- **WCAG AA Contrast:** All text, badges, and card borders exceed the 4.5:1 contrast ratio.
