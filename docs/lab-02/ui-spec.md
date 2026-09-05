# Lab 2 UI Specification

## 1. Visual Design

### Zen Green Theme Color Tokens

| Token / Element | Required Style Color Code | Description & Intended Usage |
|---|---|---|
| **Primary green** | `#006B3C` | App header background, primary action buttons, strong emphasis |
| **Secondary green** | `#0B7A46` | Active navigation tabs, focus accents, links, hover states |
| **Pale green** | `#EAF6EF` | Selected items, success backgrounds, subtle section emphasis |
| **Page background** | `#F5F7F6` | Quiet near-white body background |
| **Surface / cards** | `#FFFFFF` | White card containers with subtle border (`#E9ECEF`) and restrained shadow |
| **Text** | `#1F2421` | Dark charcoal-green for comfortable reading (not pure black) |
| **Editable field** | `#FFFFFF` | White background with clear neutral border (`#CED4DA`) |
| **Read-only field** | `#F0F4F1` | Soft gray-green shading that is clearly distinct but readable |
| **Error** | `#B7094C` | Dark red text and border; message appears immediately below field |
| **Warning** | `#E0A96D` | Amber callout or badge; not used for ordinary decoration |
| **Success** | `#2D6A4F` | Green confirmation with readable text, no reliance on color alone |

### Typography & Spacing
- **Font Family:** Inter, system-ui, -apple-system, sans-serif
- **Scale:** H1 Header (24px bold), H2 Subheader (20px semibold), H3 Component Title (16px semibold), Body Text (14px regular), Caption/Small (12px regular).
- **Spacing Grid:** 4px base (8px, 12px, 16px, 24px, 32px padding and margins).

### Button Hierarchy

| Button Level | Visual Style | Intended Usage |
|---|---|---|
| **Primary** | Solid Primary Green (`#006B3C`), white text | Main positive actions ("Create Ticket", "Continue") |
| **Secondary** | Outlined Secondary Green (`border: 1px solid #0B7A46`), green text | Secondary actions ("Clear Filters", "Back to Tickets") |
| **Tertiary** | Neutral text-only, no border (`#6C757D`) | Low priority actions ("Cancel", "Reset") |
| **Destructive** | Red fill/outline (`#B7094C`), white text | Soft remove attachment with confirmation |
| **Disabled** | Gray background (`#E9ECEF`), muted text (`#ADB5BD`), `cursor: not-allowed` | Non-clickable inactive state |
| **Busy** | Spinner icon inside button, text "Submitting...", pointer-events disabled | Form submission in progress state |

### Badge Rules

| Badge Type | Status / Priority Value | Visual Representation | Icon & Style |
|---|---|---|---|
| **Status** | `NEW` | Blue pill badge (`#0D6EFD` text, `#E7F1FF` bg) | Dot icon + "New" text |
| **Status** | `IN_PROGRESS` | Amber pill badge (`#FD7E14` text, `#FFF4E6` bg) | Clock icon + "In Progress" text |
| **Status** | `RESOLVED` | Green pill badge (`#006B3C` text, `#EAF6EF` bg) | Checkmark icon + "Resolved" text |
| **Status** | `CLOSED` | Gray pill badge (`#6C757D` text, `#E9ECEF` bg) | Lock icon + "Closed" text |
| **Priority** | `LOW` | Gray badge (`#6C757D`) | Down arrow icon + "Low" text |
| **Priority** | `MEDIUM` | Amber/Yellow badge (`#E0A96D`) | Bar icon + "Medium" text |
| **Priority** | `HIGH` | Orange badge (`#FD7E14`) | Up arrow icon + "High" text |
| **Priority** | `URGENT` | Red bold badge (`#B7094C`) | Exclamation icon + "Urgent" text |

---

## 2. Forms & Control States

### Form Control Rules
- **Labels:** Displayed directly above controls using consistent font weight (semibold) and spacing.
- **Required Fields:** Marked with a red asterisk `*` after the label. The asterisk does not replace validation error messages.
- **Inputs:** Consistent height (40px). Multiline Description is taller (min 120px) and resizable vertically only without breaking layout.
- **Validation Messages:** Displayed immediately below the associated field in dark red 12px text.

### Component Execution States

| Component State | UI Appearance & Behavior |
|---|---|
| **Initial** | Default clean form or empty search inputs |
| **Loading** | Animated skeleton rows or centered green spinner during API requests |
| **Validation Failure** | Field borders highlighted red, inline messages displayed below invalid inputs |
| **Submitting** | Input controls disabled, primary button displays busy spinner |
| **Success** | Success banner showing generated Ticket Number (e.g. `TKT-2025-001234`) and next action links |
| **API Failure** | Red alert callout displaying safe error message with form data preserved |

### Attachment UI States

| Attachment State | UI Visual Presentation |
|---|---|
| **Active / Attached** | File item card showing file icon, file name, formatted size, upload date, Download link, and Soft Remove button |
| **Uploading** | File row displaying progress bar and "Uploading..." indicator |
| **Invalid File** | Warning banner showing error (e.g., file size exceeds 5MB or invalid extension) |
| **Soft Removed** | Faded gray row tagged "Removed" with removal reason; download/preview disabled |
| **Unavailable** | Placeholder text "No active attachments uploaded for this ticket" |

---

## 3. Screens & Components

### 3.1 Application Shell & Navigation
- Top navigation bar styled in Primary Green (`#006B3C`).
- Left: TokTickIT logo & title.
- Center: Active navigation links ("My Tickets", "Create Ticket").
- Right: Active Development Requester identity display ("Jennifer Anderson") with "Change Requester" action button.

### 3.2 Development Requester Selection Screen
- Centered container card on quiet background.
- Title: "Select Development Requester"
- Explanatory Text: "Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."
- Form Element: Dropdown menu populated with active Development Requesters loaded from database (inactive Requesters excluded).
- Actions: Primary Green "Continue" button.
- Handling: Loading skeleton during fetch, empty state if no active Requesters exist, safe failure banner on API error.

### 3.3 Create Ticket Screen (Create Mode)
- Header: "Create IT Support Ticket"
- System-generated / Read-only fields near top: Requester Name, Ticket Date.
- Classification fields grouped: Category `*` dropdown, Related System `*` dropdown, Requested Priority radio/select.
- Content fields: Summary `*` text input (max 255 chars), Description multiline textarea.
- Attachments Section: File dropzone supporting JPG, PNG, WEBP, PDF (max 5 MB, max 5 active files).
- Action Bar: Primary Green "Submit Ticket" button and Secondary "Cancel" button.

### 3.4 My Tickets Screen
- Control Bar:
  - Keyword Search Input (searches summary, description, ticket number)
  - Category Filter Dropdown
  - Status Filter Dropdown
  - Related System Filter Dropdown
  - Sort Selector (Newest First, Oldest First, Priority High-to-Low)
  - "Clear Filters" Button
  - Primary "Create Ticket" Action Button
- Content Area:
  - **Desktop (>=992px):** Data table showing Ticket No., Created Date, Summary, Category, Related System, Requested Priority, IT Priority, Current Status, Ticket Owner, Last Updated.
  - **Mobile (<768px):** Stacked card view showing Ticket No., Status badge, Summary title, Category, Priority, Created Date.
- Pagination Bar: Page summary ("Showing 1 to 10 of 42 tickets"), Previous/Next buttons, page numbers.

### 3.5 Requester Ticket Detail Screen (View Mode)
- Header: Ticket Number (e.g. `TKT-2025-001234`), Status badge, Priority badge, Category, Related System, "Back to My Tickets" button.
- Read-only Detail Card: Requester, Ticket Date, Summary, Description.
- Attachments Section: Active attachments table showing File Name, Size, Upload Date, Download action, Upload Attachment action, Soft Remove action (opens confirmation prompt requesting removal reason).
- Read-only placeholders for future workflow features (Public Comments, Internal Notes, Actions Taken excluded from Lab 2 execution).

---

## 4. Responsive Requirements

| Viewport Category | Viewport Width | Required Responsive Layout Behavior |
|---|---|---|
| **Desktop** | `>= 992 px` | Multi-column layout as specified; content centered with maximum container width |
| **Tablet** | `768 px - 991 px` | Two-column layout where practical; Summary and Description receive sufficient width |
| **Mobile** | `< 768 px` | Fields stack vertically; buttons remain touch-friendly; table transforms to card stack; zero horizontal scroll |
| **All Sizes** | All Viewports | No clipped labels, overlapping messages, hidden buttons, or unreadable file attachment names |

---

## 5. Accessibility

- **Keyboard Focus:** Logical Tab sequence across header navigation, filters, form fields, and data table rows. Visible 2px green focus ring (`#0B7A46`) on active controls.
- **Accessible Labels:** Every form input includes `<label htmlFor="...">` and `aria-label` / `aria-describedby` attributes.
- **Non-Color Reliance:** Status and priority badges combine distinct color coding with text labels and icons (dots, checkmarks, clocks, exclamation marks) for colorblind usability.

---

## 6. Visual Verification

### Visual Inspection Checklist
- [ ] Color scheme conforms strictly to Zen Green token specification.
- [ ] Required fields display red asterisk `*` and inline error messages immediately below inputs.
- [ ] Desktop data table shifts cleanly to responsive card stack on mobile viewports (<768px).
- [ ] Status and priority badges include distinct non-color text labels and icons.
- [ ] Attachment section handles active, uploading, invalid, and soft-removed states cleanly.

### Screenshot Evidence Paths

| Screenshot ID | Target UI View | Planned Screenshot File Path |
|---|---|---|
| SHOT-01 | Development Requester Selection Screen | `docs/lab-02/image-requester-select.png` |
| SHOT-02 | Create Ticket Screen (Initial & Validation) | `docs/lab-02/image-create-ticket.png` |
| SHOT-03 | My Tickets Screen (Desktop Table & Mobile Cards) | `docs/lab-02/image-my-tickets.png` |
| SHOT-04 | Requester Ticket Detail & Attachments View | `docs/lab-02/image-ticket-detail.png` |
