# Lab 4 UI Specification

## 1. Zen Green Design System & Theme Foundations

Lab 4 maintains strict visual continuity with the **Zen Green** design language established in Lab 2 and Lab 3 while introducing new operational components: Metric Cards, Interactive Charts/Distributions, Actions Taken Timelines, Parent-Child Relationship Panels, and Resolution Gate Dialogs.

### 1.1 Color Tokens
- **Primary Zen Green:** `#006B3C` (Primary actions, active tab headers, key metrics, brand accents)
- **Primary Hover / Focus:** `#0B7A46` / `#004D2B` (Button hover, active navigation pills, focus outlines)
- **Pale / Tint Green:** `#EAF6EF` (Active tab fills, success callouts, metric card subtle highlights)
- **Quiet App Background:** `#F5F7F6` (Main screen canvas, dashboard backing, card borders)
- **Surface White:** `#FFFFFF` (Card interiors, modal dialogs, data table rows)
- **Text Primary:** `#1A1D1C` (Headings, primary form labels, metric values)
- **Text Muted:** `#5A625E` (Subtitles, timestamps, unit indicators, table headers)
- **Border / Divider:** `#D8E0DC` (Card borders, dividers, subtle gridlines)

### 1.2 Contextual Metric & Indicator Tokens
Metric cards and status badges use semantic color accents to convey urgency and operational status:
- **Open / Backlog Accent:** `#0288D1` (Soft Blue — Total Open metric card left accent, `NEW` badge)
- **Unassigned / Warning Accent:** `#ED6C02` (Amber/Orange — Unassigned card accent, `UNASSIGNED` pill)
- **Waiting for Requester Accent:** `#7B1FA2` (Purple — Waiting card accent, `WAITING_FOR_REQUESTER` pill)
- **Urgent / Incident Accent:** `#D32F2F` (Crimson Red — Urgent/High card accent, `URGENT` badge)
- **Resolved / Success Accent:** `#006B3C` (Zen Green — Resolved Today card accent, `RESOLVED` pill)
- **Time / Duration Accent:** `#37474F` (Slate Gray — Avg Resolution Time card accent, duration chips)

### 1.3 Action Type Visual Badges
Actions Taken categories use distinct badges to ensure quick visual recognition in activity feeds:
- `DIAGNOSIS`: Teal pill (`#E0F2F1`, text `#004D40`, icon `🔍`)
- `INVESTIGATION`: Soft Blue pill (`#E3F2FD`, text `#0D47A1`, icon `🔬`)
- `WORKAROUND`: Amber pill (`#FFF8E1`, text `#E65100`, icon `⚡`)
- `VENDOR_ESCALATION`: Purple pill (`#F3E5F5`, text `#4A148C`, icon `🏢`)
- `HARDWARE_REPAIR`: Deep Orange pill (`#FBE9E7`, text `#BF360C`, icon `🛠️`)
- `SOFTWARE_PATCH`: Indigo pill (`#E8EAF6`, text `#1A237E`, icon `💻`)
- `COMMUNICATION`: Green Tint pill (`#E8F5E9`, text `#1B5E20`, icon `💬`)
- `RESOLUTION_STEP`: Dark Zen Green pill (`#EAF6EF`, text `#006B3C`, icon `✅`)
- `OTHER`: Neutral Gray pill (`#EEEEEE`, text `#616161`, icon `📋`)

---

## 2. Navigation & App Shell Updates

### 2.1 Role-Based Header Navigation
The global navigation header dynamically displays links based on authenticated user role:
- **Requester View:** `My Tickets` | `Create Ticket`
- **IT Staff View:** `Dashboard` *(New in Lab 4)* | `Ticket Queue` | `Create Ticket`
- **Administrator View:** `Dashboard` *(New in Lab 4)* | `Ticket Queue` | `User Management`
- **Top Right User Widget:**
  - Authenticated user avatar, name, and role badge (`Requester`, `IT Staff`, `Administrator`).
  - Dropdown menu: "Change Password" link, "Logout" button.

---

## 3. Screen Specifications

### 3.1 Operational Dashboard (`/staff/dashboard`)

#### 3.1.1 Overview & Header
- **Page Title:** "Operations Dashboard"
- **Subtitle:** "Real-time queue health, operational velocity, and workload distribution."
- **Controls Area (Top Right):**
  - "Refresh Data" button with sync icon.
  - Quick link: "View All Tickets" button (navigates to `/staff/tickets`).

#### 3.1.2 KPI Metric Cards Grid
Displays 6 high-visibility cards structured in a responsive CSS grid (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`):

| Metric Card | Accent Color | Primary Figure | Subtitle / Trend Context | Drill-Down Target Route & Query |
|---|---|---|---|---|
| **Total Open Tickets** | `#0288D1` (Blue) | Numeric (e.g. `48`) | "Active queue backlog" | `/staff/tickets?status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED` |
| **Unassigned Tickets** | `#ED6C02` (Amber) | Numeric (e.g. `12`) | "Awaiting staff assignment" | `/staff/tickets?ownership=unassigned&status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED` |
| **Waiting for Requester** | `#7B1FA2` (Purple) | Numeric (e.g. `9`) | "Awaiting user feedback" | `/staff/tickets?status=WAITING_FOR_REQUESTER` |
| **Urgent / High Priority** | `#D32F2F` (Red) | Numeric (e.g. `6`) | "Requires immediate triage" | `/staff/tickets?priority=URGENT,HIGH&status=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED` |
| **Resolved Today** | `#006B3C` (Green) | Numeric (e.g. `14`) | "Remediated since midnight" | `/staff/tickets?status=RESOLVED&resolvedRange=today` |
| **Avg Resolution Time** | `#37474F` (Slate) | Formatted (e.g. `3h 45m`) | "Last 30-day average" | `/staff/tickets?status=RESOLVED` |

#### 3.1.3 Metric Card Visual Specifications
- **Container:** Background `#FFFFFF`, border `1px solid #D8E0DC`, border-radius `8px`, box-shadow `0 2px 4px rgba(0,0,0,0.04)`.
- **Left Accent Indicator:** `border-left: 5px solid <Accent Color>` indicating metric urgency.
- **Header:** Metric label in `0.85rem` uppercase bold font (`color: #5A625E`) alongside a contextual SVG icon.
- **Value:** Prominent `2.25rem` bold font (`color: #1A1D1C` or `#006B3C`).
- **Footer:** Subtitle note and chevron indicator (`→`) indicating clickable drill-down capability.
- **Hover & Focus State:** On `:hover` and `:focus-visible`, card translates `translateY(-2px)`, elevates shadow to `0 6px 12px rgba(0,0,0,0.08)`, and displays a subtle `2px solid #006B3C` focus outline.

#### 3.1.4 Distribution Breakdown Widgets
Below the metric cards grid, the dashboard renders two distribution panels:
1. **Queue Breakdown by Status & Priority:**
   - Multi-segment progress bar showing distribution of open tickets across statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`).
   - Priority distribution pills showing count of `URGENT`, `HIGH`, `MEDIUM`, `LOW` tickets.
   - Each segment is clickable and filters the ticket queue accordingly.
2. **Category Distribution Table / Bar Chart:**
   - Visual breakdown of open tickets grouped by system category (Hardware, Software, Network, Access, Email, etc.).
   - Displays category name, ticket count, and percentage share of open queue.

---

### 3.2 Actions Taken Activity Feed & Modal (`/staff/tickets/:id`)

#### 3.2.1 Section Architecture
- Positioned on the IT Staff Ticket Detail screen. Can be viewed via a tabbed layout (`[ Public Comments ] [ 🔒 Internal Notes ] [ 🛠️ Actions Taken (N) ] [ 🔗 Child Tickets (M) ]`) or stacked alongside internal notes.
- **Header:** "Actions Taken" title, action counter badge, and "+ Log Action Taken" primary button (Zen Green).

#### 3.2.2 Timeline Activity Feed
Chronological vertical feed listing each recorded action:
- **Timeline Connector:** Subtle vertical line (`2px solid #D8E0DC`) connecting sequential actions.
- **Action Card Layout:**
  - **Top Row:** Action Type badge (e.g., `[🔍 DIAGNOSIS]`), time spent chip (`⏱️ 45m`), and relative timestamp (`"2 hours ago"` with hover tooltip showing absolute ISO timestamp).
  - **Performer Attribution:** Avatar initials circle, performer name, and role pill (e.g., `Alex Thompson [IT Staff]`). Distinct from the Ticket Owner displayed in the sidebar.
  - **Summary:** Bold heading (`1rem`, `#1A1D1C`) summarizing the action.
  - **Details:** Multi-line text block with preserved whitespace or basic markdown rendering detailing steps, findings, or commands executed.

#### 3.2.3 "Log Action Taken" Modal Dialog
- **Modal Title:** "Log Action Taken"
- **Form Controls:**
  - `Action Type` (Dropdown, required): Standardized options (`Investigation`, `Diagnosis`, `Workaround`, `Vendor Escalation`, `Hardware Repair`, `Software Patch`, `Communication`, `Resolution Step`, `Other`).
  - `Summary` (Input text, required, max 150 chars): Concise description (e.g., "Tested memory modules and verified bad DIMM in slot 2").
  - `Details` (Textarea, required, min 10 chars, max 2000 chars): Detailed explanation of technical actions executed.
  - `Time Spent` (Number input, required): Duration in minutes (e.g., `30`). Defaults to `0`. Non-negative integer.
  - `Optional Claim Toggle` (Checkbox, rendered only if ticket is unassigned): "Claim this ticket as owner".
- **Action Buttons:** "Cancel" (secondary outline) and "Save Action Taken" (Zen Green primary).
- **Validation:** Live error feedback below inputs if required fields are missing or lengths violated.

---

### 3.3 Parent-Child Ticket Hierarchy Widget (`/staff/tickets/:id`)

#### 3.3.1 Linked Child Tickets Panel (Parent View)
Rendered when viewing a parent ticket (or a ticket that can become a parent):
- **Header:** "Linked Child Tickets" with count badge and "+ Link Child Ticket" button.
- **Child Tickets Table / Card List:**
  - Columns: `Ticket No.`, `Summary`, `Req. By`, `Priority`, `Status` (with badge), `Owner`, `Action`.
  - Action column features an "Unlink" button (`✕`) with confirmation prompt.
  - If a child ticket is unresolved, its status badge displays an amber warning ring indicating it blocks parent resolution.
- **Empty State:** When no child tickets are linked, displays: *"No child tickets linked. Link related tickets to coordinate resolution."*

#### 3.3.2 Parent Ticket Banner (Child View)
Rendered at the top of the Ticket Detail screen when viewing a ticket that has a parent:
- **Visual Design:** Full-width Zen Green callout card (`background: #EAF6EF; border: 1px solid #B7E4C7; border-left: 5px solid #006B3C`).
- **Content:** Pin icon (`📌`), text: `"Child Ticket — Linked to Parent Ticket: "`, parent ticket number (`TCK-2026-0034`), parent summary, and `"View Parent Ticket →"` link button.

#### 3.3.3 "Link Child Ticket" Modal Dialog
- **Modal Title:** "Link Child Ticket"
- **Controls:**
  - Searchable autocomplete dropdown displaying eligible tickets (searches by ticket number, summary, or requester).
  - Excludes: the current ticket itself (self-link), tickets that are already parent tickets (hierarchy depth restriction), tickets already linked to another parent.
  - Displays selected ticket summary preview with priority and status.
- **Action Buttons:** "Cancel" and "Link as Child" (Zen Green primary).

---

### 3.4 Resolution Gate Modal & Status Workflow

#### 3.4.1 Resolution Trigger
When an IT Staff or Admin user changes the status dropdown on Ticket Detail to `RESOLVED`, the system opens the **"Confirm Ticket Resolution"** modal dialog instead of immediately updating the status.

#### 3.4.2 Precondition Verification Checklist
The modal runs real-time client-side checks and presents a visual checklist:
1. **Actions Taken Prerequisite:**
   - If `actionsCount > 0`: Green checkmark (`✓ At least 1 Action Taken recorded (N logged)`).
   - If `actionsCount === 0`: Red warning (`✕ No Actions Taken logged. At least one action must be recorded before resolving.`) with quick-action link `[+ Log Action Now]`.
2. **Child Tickets Completion Prerequisite:**
   - If `openChildTicketsCount === 0`: Green checkmark (`✓ All linked child tickets are resolved or closed (or none linked)`).
   - If `openChildTicketsCount > 0`: Red warning (`✕ Cannot resolve: M linked child tickets are still open:`) followed by a list of open child ticket numbers (`TCK-2026-0045, TCK-2026-0048`).
3. **Resolution Summary Input:**
   - Label: "Resolution Summary / Remediation Details" *(Required)*
   - Textarea (min 10 characters, max 2000 characters).
   - Live character counter: `"42 / 2000 characters"`. Shows `"Minimum 10 characters required"` until met.
   - Placeholder: *"Describe the root cause and the specific resolution steps performed to resolve this issue..."*

#### 3.4.3 Submission & Confirmation Behavior
- The "Confirm & Resolve Ticket" button remains **disabled** until all three criteria are satisfied.
- Upon submission, a loading spinner is displayed.
- If the server accepts the resolution, the modal closes, a top-right success toast is shown (`"Ticket marked as Resolved"`), and the status badge updates to `RESOLVED`.
- If the server rejects the resolution (`422 Unprocessable Entity`), an inline red alert banner displays the exact blocking errors returned by the server.

---

## 4. Screen Modes & User Feedback Matrix

| State / Condition | Trigger Event | Visual Feedback & Component Behavior |
|---|---|---|
| **Loading / Busy** | Fetching dashboard metrics or logging action | Metric cards render skeleton shimmer placeholders; modal buttons show spinner and disable. |
| **Validation Error** | Submitting action or resolution with invalid fields | Red border around input field, inline error message below field (`aria-live="polite"`). |
| **Empty Dashboard** | System with zero tickets | Metric cards display `0`, average resolution displays `0m`, and clean empty callout shown. |
| **Resolution Gate Blocked (422)** | Attempting resolution with unmet criteria | Red alert callout listing specific blocking items: missing action, missing summary, or open child tickets. |
| **Cycle Conflict (409)** | Attempting to link ticket as child when it is already a parent | Error banner: `"Invalid hierarchy: A ticket with existing child tickets cannot be linked as a child."` |
| **Forbidden (403)** | Requester attempting dashboard or action logging | Full-page 403 Zen Green callout: `"403 Access Denied. Operational features are restricted to IT Staff."` |
| **Success Toast** | Action logged, child linked, ticket resolved | Top-right Zen Green toast banner auto-dismissing after 4 seconds with checkmark icon. |

---

## 5. Responsive & Accessibility Rules

### 5.1 Responsive Breakpoints
- **Desktop ($\ge 992\text{px}$):**
  - Dashboard: 3-column or 6-column metric card grid. Side-by-side distribution breakdown widgets.
  - Ticket Detail: Multi-column workbench with dedicated right-hand operational panels.
- **Tablet ($768\text{px} - 991\text{px}$):**
  - Dashboard: 2-column metric card grid. Distribution widgets stack vertically.
  - Ticket Detail: Operational panels compress padding; child ticket table scrolls horizontally with fixed headers or transforms into cards.
- **Mobile ($< 768\text{px}$):**
  - Dashboard: 1-column stacked metric cards. Full-width cards with clear vertical spacing.
  - Child Tickets & Actions Feed: Tables convert into full-width stacked card components.
  - Modals: Full-screen modal overlay on mobile with fixed bottom action buttons.
  - Zero horizontal page scrolling.

### 5.2 Accessibility Expectations (WCAG AA)
- **Keyboard Navigation:** Metric cards, action buttons, timeline items, and child ticket links are fully reachable via `Tab` with a visible `2px solid #006B3C` focus ring.
- **Screen Reader Announcements:** Metric cards include `aria-label` providing full context (e.g. `aria-label="Total Open Tickets: 48, click to view open tickets in queue"`).
- **Resolution Gate Modals:** Modals implement `role="dialog"`, `aria-modal="true"`, and autofocus the first interactive element.
- **Contrast Ratios:** All text, badges, and card borders exceed the WCAG AA minimum contrast ratio of 4.5:1.
