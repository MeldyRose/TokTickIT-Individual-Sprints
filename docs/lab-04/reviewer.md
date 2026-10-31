# Lab 4 — Peer Review Record

**Author:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: [@MeldyRose](https://github.com/MeldyRose)  
**Peer reviewer:** Phattaratorn Mahatkeerati — 67070503433 — GitHub: [@GGital](https://github.com/GGital)  

---

## 1. Pull Requests I Authored (Reviewed by My Partner @GGital)

| PR | Branch | Reviewer Verdict |
|:---:|---|---|
| [63](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/63) | `feature/22-lab-4-specification` | `Changes Requested → Approved` |
| [64](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/64) | `feature/23-database-schema-evolution` | `Approved` |
| [65](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/65) | `feature/24-actions-taken-api` | `Changes Requested → Approved` |
| [66](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/66) | `feature/25-ticket-workflow-resolution-gate` | `Changes Requested → Changes Requested → Approved` |
| [67](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/67) | `feature/26-actions-taken-ui` | `Changes Requested → Approved` |
| [68](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/68) | `feature/27-ticket-workflow-ui` | `Changes Requested → Approved` |
| [69](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/69) | `feature/28-dashboard-api` | `Changes Requested → Approved` |
| [70](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/70) | `feature/29-staff-dashboard-ui` | `Approved` |
| [71](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/71) | `feature/30-requester-dashboard-ui` | `Changes Requested → Approved` |
| [72](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/72) | `feature/31-e2e-inspection-docs` | `Pending Review` (Under Review) |

---

## 2. Detailed Review Discussions on My Pull Requests

### [PR #63](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/63) — `feature/22-lab-4-specification`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Requested alignment with the Lab 4 handout requirements:
  1. Specify all mandatory Action Taken fields: Performer, Date/Time, Description, Result, and conditional Follow-up note.
  2. Support editable Actions Taken (via `PATCH`) rather than only append-only creation.
  3. Include specifications for the Requester read-only view on Actions Taken and the dedicated Requester Dashboard.
  4. Document stale-update Optimistic Concurrency Control (OCC) and clean down-migration database rollback.
- **My Response (@MeldyRose):** Aligned `docs/lab-04/specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` with the handout: documented full Action Taken fields, `PATCH` endpoint contracts for editing, Requester read-only viewing, dedicated Requester Dashboard metrics, OCC timestamp comparison, and rollback script specifications.
- **Final Verdict:** `Approved`

### [PR #64](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/64) — `feature/23-database-schema-evolution`
- **Verdict:** `Approved`
- **Reviewer Comment (@GGital):** Verified Prisma schema evolution:
  - `ActionTaken` model created with foreign keys (`ticketId`, `performerId`), cascading deletion upon parent ticket deletion, and indexes on `ticketId`, `performerId`, and `actionDateTime`.
  - Additive ticket resolution columns (`resolvedAt`, `closedAt`, `resolutionSummary`) added without breaking existing records.
  - Reversible down-migration rollback script (`rollback.sql`) verified and tested in `migration.test.ts`.
  - Seed script populates diverse tickets with 0, 1, and multiple actions idempotently. Ready to merge!
- **My Response (@MeldyRose):** Merged into `lab4-staging`.

### [PR #65](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/65) — `feature/24-actions-taken-api`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review flagged three issues:
  1. The 1-second OCC tolerance window was too lenient and risked lost updates; OCC must enforce exact timestamp matching.
  2. Missing or invalid `expectedUpdatedAt` was bypassing the OCC check instead of being rejected.
  3. Potential race condition in `claimTicket: true` on unassigned tickets.
- **My Response (@MeldyRose):** Removed the 1s OCC tolerance to enforce exact timestamp equality, added strict validation rejecting missing or invalid `expectedUpdatedAt` with `400 Bad Request`, and wrapped action creation and ticket claiming in an atomic database transaction. Verified all 34 API tests pass cleanly.
- **Final Verdict:** `Approved`

### [PR #66](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/66) — `feature/25-ticket-workflow-resolution-gate`
- **Review Round 1:** `Changes Requested`
  - **Reviewer Comment (@GGital):**
    1. Transitioning a ticket to its identical current status should be rejected with `400 Bad Request` instead of a no-op 200.
    2. Move `rollback.sql` out of the test folder to `docs/lab-04/rollback.sql`.
  - **My Response (@MeldyRose):** Added same-status transition validation returning 400 Bad Request and relocated `rollback.sql`.
- **Review Round 2:** `Changes Requested`
  - **Reviewer Comment (@GGital):**
    1. Regression on Requester advisory resolution ("Problem Appears Resolved"): the endpoint call failed because `expectedUpdatedAt` was missing or not propagated properly.
  - **My Response (@MeldyRose):** Updated client `updateRequesterTicketStatus` to pass `expectedUpdatedAt` and properly parse structured error envelopes. Re-verified all status transitions and server test suites.
- **Final Verdict:** `Approved`

### [PR #67](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/67) — `feature/26-actions-taken-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Requested fixes on user experience and data binding:
  1. Support date/time editing in Action Taken modal rather than fixing it strictly to now.
  2. Ensure simultaneous ticket claiming triggers an immediate ticket detail refresh so the new owner is reflected.
  3. Verify performer attribution is retained when another staff member edits an action.
  4. Ensure read-only view for requesters hides all action creation/edit buttons.
- **My Response (@MeldyRose):** Updated `ActionTakenModal` with date picker support, wired state refresh on ticket claim, verified performer audit preservation, and confirmed requester read-only mode in component tests.
- **Final Verdict:** `Approved`

### [PR #68](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/68) — `feature/27-ticket-workflow-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review requested three UI workflow improvements:
  1. Add modal confirmation dialog for terminal `CANCELLED` status transitions.
  2. Closure remarks on `CLOSED` transition were inadvertently being posted as a public comment instead of being recorded in the ticket resolution/audit record.
  3. Implement live checklist in `StatusTransitionModal` displaying real-time feedback for Resolution Gate criteria (Actions Taken $\ge 1$ and Resolution Summary $\ge 10$ chars) and handle backend 422 diagnostic detail arrays.
- **My Response (@MeldyRose):** Addressed all items in commit `efa90c3`. Added confirmation modal for `CANCELLED`, fixed closure remarks so they are stored as internal resolution notes rather than public comments, and built the live reactive Resolution Gate checklist with `ConcurrencyConflictBanner`.
- **Final Verdict:** `Approved`

### [PR #69](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/69) — `feature/28-dashboard-api`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Flagged edge cases in dashboard calculation logic:
  1. Align `recentlyResolved` query filtering with BR-20 specifications (tickets resolved within the last 7 days).
  2. Flaky shared-DB tests in concurrent test runs due to unisolated test database mutations.
- **My Response (@MeldyRose):** Aligned `recentlyResolved` window with BR-20 criteria (7-day window) in `server/src/utils/dashboardUtils.ts` and improved test database isolation and teardown in `server/tests/lab-04/staff-dashboard.api.test.ts`. Confirmed sub-200ms query performance.
- **Final Verdict:** `Approved`

### [PR #70](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/70) — `feature/29-staff-dashboard-ui`
- **Verdict:** `Approved`
- **Reviewer Comment (@GGital):** Straight approval. Operations Dashboard renders 7 interactive KPI cards, tab focus rings (`2px solid #006B3C`), zero horizontal overflow across Desktop, Tablet, and Mobile, and 1-click drill-down navigation to pre-filtered Staff Ticket Queue. All component tests pass cleanly.
- **My Response (@MeldyRose):** Thanks for the quick review! Merged into `lab4-staging`.

### [PR #71](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/71) — `feature/30-requester-dashboard-ui`
- **Initial Verdict:** `Changes Requested`
- **Reviewer Comment (@GGital):** Review caught filter lifecycle state persistence issues:
  1. Clicking metric cards to drill down into My Tickets should preserve query parameters (`/tickets?status=...&resolvedRange=...`) across browser back/forward and tab navigation.
  2. Location listener in `App.tsx` should use user references to avoid stale closure state during role changes.
- **My Response (@MeldyRose):** Addressed in commits `edc98fc`, `dd6b69f`, and `372bfc2`. Implemented bidirectional URL query parameter synchronization, updated location listeners using `userRef`, and verified all 33 component tests pass.
- **Final Verdict:** `Approved`

### [PR #72](https://github.com/MeldyRose/TokTickIT-Individual-Sprints/pull/72) — `feature/31-e2e-inspection-docs`
- **Current Verdict:** `Pending Review` (Under Review)
- **Reviewer Comment (@GGital):** Pending peer review verification of Playwright E2E suites, fresh-seed screenshot evidence, routing alignment, and finalized documentation.
- **My Response (@MeldyRose):** Addressed review comments; submitted for re-review.

---

## 3. Pull Requests I Reviewed for My Partner (@GGital)

Repository: [GGital/TocktickIT](https://github.com/GGital/TocktickIT)

| PR | Branch | Review Verdict |
|:---:|---|---|
| [91](https://github.com/GGital/TocktickIT/pull/91) | `docs/lab4-spec` | `Approved` |
| [92](https://github.com/GGital/TocktickIT/pull/92) | `feat/lab4-data-model-migration-seed` | `Approved` |
| [93](https://github.com/GGital/TocktickIT/pull/93) | `feat/lab4-actions-taken-api` | `Approved` |
| [94](https://github.com/GGital/TocktickIT/pull/94) | `feat/lab4-ticket-workflow-api` | `Approved` |
| [95](https://github.com/GGital/TocktickIT/pull/95) | `feat/lab4-dashboard-api` | `Approved` |
| [96](https://github.com/GGital/TocktickIT/pull/96) | `feat/lab4-actions-taken-ui` | `Approved` |
| [97](https://github.com/GGital/TocktickIT/pull/97) | `feat/lab4-ticket-workflow-ui` | `Approved` |
| [98](https://github.com/GGital/TocktickIT/pull/98) | `feat/lab4-dashboards-ui` | `Approved` |
| [99](https://github.com/GGital/TocktickIT/pull/99) | `feat/lab4-hardening-regression` | `Changes Requested → Approved` |
| [100](https://github.com/GGital/TocktickIT/pull/100) | `feat/lab4-e2e-responsive-screenshots` | `Approved` |

---

### [PR #91: docs: completed specifications](https://github.com/GGital/TocktickIT/pull/91) — `docs/lab4-spec`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > LGTM! Everything passes the review.
  >
  > I went through all four docs in `docs/lab-04/` and checked the requirements:
  > - All IDs (FR-01–FR-34, BR-01–BR-84, AC-01–AC-52, A-01–A-21) match up cleanly across the specs.
  > - Checked `tests.md` §3.1 — all 52 ACs are mapped, and all 157 planned tests are set to `Pending`.
  > - Decisions 1–5 all make sense and look solid to proceed with.
  > - Verified it's strictly docs-only with no code/schema changes.
  >
  > *(Quick heads up: the PR description says "6 new and 6 changed endpoints", but the spec tables actually list 8 new and 7 changed endpoints including the dashboards. The spec itself is completely accurate, just a tiny typo in the PR body text.)*
  >
  > Ready to merge!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #92: feat: changed db schema for the action](https://github.com/GGital/TocktickIT/pull/92) — `feat/lab4-data-model-migration-seed`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > LGTM! Approved. 🚀 
  >
  > Everything here looks solid and aligns with the spec:
  > - The migration is purely additive, the backfill logic (`version`, `resolvedAt`, `publicActivityAt`) is clean, and the raw-SQL `CHECK` constraints match §7.1.
  > - Good catch on the Prisma `P3012` behavior with `prisma migrate resolve --rolled-back`. Deleting the history row in `down.sql` is definitely the right practical approach here, and the round-trip test confirms it works as expected.
  > - Seed mix covers all required cases and stays idempotent.
  > - Leaving the resolve check in API-71 skipped until PR #82 lands makes total sense since the gate hasn't been implemented yet.
  >
  > Nice work, ready to merge into `lab4-staging`!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #93: completed backend API for recording the work on the Ticket](https://github.com/GGital/TocktickIT/pull/93) — `feat/lab4-actions-taken-api`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > LGTM!
  >
  > ### My PR Review: **Approved**
  >
  > All requirements from Issue #81 and the Lab 4 specifications have been thoroughly reviewed:
  > - **Validation Order & Feedback:** Fully aligns with `api-spec.md` §3.3 – §3.6, with all validation errors returned in a single `400 VALIDATION_FAILED` response.
  > - **Idempotency & Concurrency:** Robust handling of `clientRequestId` (including concurrent `P2002` deduplication) and optimistic concurrency on `version` (`409 STALE_ACTION`).
  > - **Authorization & Data Protection:** Staff routes under `/api/staff` refuse Requesters before ticket lookups (BR-72); handler-level checks restrict edits/voids to performer, owner, or admin (BR-18).
  > - **Projections:** Requester projection cleanly filters out voided actions and strictly exposes the documented §2.2 shape without internal IDs or audit fields.
  > - **Out-of-Scope Changes:** The updates to `src/messages.ts` to maintain `publicActivityAt` on Public Comments and the "appears resolved" flag are compliant with BR-45 and appropriate to include here for API-25.
  >
  > No fixes needed. Excellent work!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #94: Backend for the Requester and IT Staff dashboards](https://github.com/GGital/TocktickIT/pull/94) — `feat/lab4-ticket-workflow-api`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > Looks great to me! Pulled the branch and ran the test suite locally—everything is green.
  >
  > A few quick thoughts on your checklist:
  > - Totally fine with updating Lab 3 `UNIT-09` instead of deleting it. With the new resolution gate and BR-33, adjusting the assertion makes complete sense.
  > - The validation order and the optimistic concurrency checks (no row locking) look really clean.
  > - Merging ahead of #85 is fine by me even if the staff UI breaks temporarily until the frontend PR lands.
  >
  > Approved! 👍
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #95: Backend for the Requester and IT Staff dashboards](https://github.com/GGital/TocktickIT/pull/95) — `feat/lab4-dashboard-api`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > LGTM! Approved 👍
  >
  > Really clean implementation—everything matches the spec and the tests look great.
  >
  > Quick thoughts on what you flagged:
  > - **`requesterFlagged` link:** Good catch adding the active statuses. Keeping the count reconciled with `meta.totalItems` is definitely the right move here so cancelled tickets don't mess up the list.
  > - **Lab 2/3 test updates:** Makes total sense. `CLOSED` is valid now, and updating the queue summary shape for `outstandingFollowUps` is expected.
  > - Scoping to `requesterId`, role guards (403s), and the shared `followUpTickets` logic all look solid.
  >
  > Ready to merge into `lab4-staging`! 🚀
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #96: Adds the Actions Taken panel to the IT Staff Ticket Detail screen](https://github.com/GGital/TocktickIT/pull/96) — `feat/lab4-actions-taken-ui`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > ## LGTM / Approved :shipit:  
  >
  > Looks great! Everything from Issue #84 and the spec is covered cleanly, and no fixes are needed.
  >
  > ### Key checks:
  > - **Form & Idempotency:** Conditional follow-up note shows only on "Yes", keeps state, and is omitted on "No" (AC-39). Double-click guard is in place, and retries reuse `clientRequestId` without clearing inputs on error (AC-45, AC-46).
  > - **Concurrency & Permissions:** `StaleCallout` shows the latest values without wiping user edits (AC-11). The row menu strictly respects API flags (`canEdit`, `followUpOutstanding`), and voiding requires a reason (AC-10, AC-14).
  > - **Views & A11Y:** Non-actionable tickets show the correct reason text (AC-06). Requester detail is properly read-only (AC-16). Dialog focus trapping/return and row menu keyboard controls work smoothly (AC-51).
  > - **Styling:** Follows the Zen Green tokens strictly with zero color literals added (AC-50).
  >
  > ### Verification:
  > - Tests: 286/286 passed (`npm test` including UNIT-12/13, UI-10–21, A11Y-02–04).
  > - Build & Lint: `tsc -b && vite build` built cleanly; 0 lint errors.
  >
  > Ready to merge into `lab4-staging`!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #97: Updates the Staff Ticket Detail workflow panel so it offers only perm…](https://github.com/GGital/TocktickIT/pull/97) — `feat/lab4-ticket-workflow-ui`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > Great work on this! Everything scoped in the issue is covered and hits the acceptance criteria cleanly:
  >
  > - The status select relies strictly on `allowedTransitions` with the current status disabled.
  > - The blockers callout, `#actions` anchor, `aria-describedby`, and save-time `409 RESOLUTION_BLOCKED` reset work as expected.
  > - `expectedVersion` is sent across status, owner, and priority changes, with solid stale ticket handling ("You tried: …").
  > - Reactive refresh without a reload and the Requester "Resolved on" display are in place, with UI-22–UI-27 all passing.
  >
  > A couple of quick notes from your checklist:
  >
  > 1. **Lab 3 test updates:** Approved—updating the fixtures and request bodies for `expectedVersion` makes complete sense with BR-78.
  > 2. **Blockers callout a11y:** Good callout on `role="alert"`. To avoid screen readers aggressively interrupting right on page load, let's switch the static banner to `role="status"` (or standard descriptive text) and keep `role="alert"` for dynamic save-time rejections.
  > 3. Panel Heading: Let's keep "Operations". Aligning with "Workflow" from the mockup isn't worth breaking existing Lab 3 test queries.
  >
  > Once that small a11y tweak is in place, this is ready to merge!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #98: Finished Dashboard UI](https://github.com/GGital/TocktickIT/pull/98) — `feat/lab4-dashboards-ui`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > Looks great! I went through the changes and rechecked everything against the spec and tests:
  >
  > - **Dashboards & Navigation:** Landing on the role's dashboard after login (BR-79) and keeping Dashboard first in navigation works seamlessly. Parent active highlighting on detail routes (`aria-current="page"`) is also spot on.
  > - **Drill-downs & URL Sync:** The drill-down integration is really clean. The 8 status chips on My Tickets, the Queue follow-up select, and the dismissible "Showing: …" banner all sync up nicely with the URL params.
  > - **States & Error Handling:** Verified the all-zero welcome card, loading skeletons, and the safe error callout with "Try again" (glad the shell stays interactive on failure).
  > - **Outside changes:** Updating the Lab 3 test assertions makes total sense due to the new home route, and sticking to the spec for `.zen-metric-attention` over the hook warning was the right call.
  > - **Tests & Build:** Full client suite is green (324/324 passing), build succeeds, and no new lint warnings.
  >
  > Just a quick heads-up on the tablet layout: don't forget to have that 3rd card on the Requester dashboard span across both columns (`ui-spec.md` §4.2) when you work on the responsive screenshots in #88.
  >
  > Nice work, ready to merge into `lab4-staging`!
- **Partner's Response (@GGital):** Merged into `lab4-staging`.

---

### [PR #99: Product polish across the whole application: consistent feedback stat…](https://github.com/GGital/TocktickIT/pull/99) — `feat/lab4-hardening-regression`
- **Initial Verdict:** `Changes Requested`
- **My Comment (@MeldyRose):**
  > Solid PR overall! The scope is well covered:
  > - The health probe (`GET /api/health`, BR-84) handles the 2s timeout cleanly and hides internal details on 503.
  > - `formatBangkok` replaces all fragmented date helpers consistently.
  > - Double-submit guards (`inFlight` ref) and form persistence on errors are working properly.
  > - **Reviewer decisions approved:** The Lab 1 health test update (`database: "ok"`), the `invalid-transition` screenshot showing the stale ticket callout (BR-28), and the `recordAction` E2E helper (BR-35) all make sense given the Lab 4 contracts.
  >
  > ### Issues to fix before merge
  >
  > Running `cd client && npm test` fails with exit code 1 under full suite load due to two issues:
  >
  > 1. **Test timeout in `Hardening.test.tsx` (`Create Ticket`)**  
  >    Simulating keystrokes with `userEvent.type` for the summary and description easily exceeds Vitest's default 5000 ms timeout when all 32 test files run together (~5037 ms).  
  >
  > 2. **Unhandled rejection in `ShellNavigation.test.tsx`**  
  >    The test for `/staff/tickets/41` fetches from the API, but the mocked fetch returns `[]` because `/api/staff/tickets/41` isn't in the route map. `StaffTicketDetail` treats the truthy array as loaded, passing `undefined` priority to `PriorityBadge` and throwing an uncaught `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.  
  >
  > Once those client test fixes are in and `npm test` runs green from end to end, this is ready to approve!
- **Partner's Response (@GGital):**
  > Fixed both. ShellNavigation’s fetch stub now answers unknown routes with 404, like stubApi, so the staff detail no longer gets a fake [] ticket. Hardening fills fields with fireEvent.change. A full run then showed the same 5 s timeout in 7 older tests that type key by key, so I raised testTimeout to 15 s and Testing Library’s asyncUtilTimeout to 5 s instead of rewriting them. npm test was green three runs in a row, exit 0. 😄
- **Final Verdict:** `Approved`
- **My Final Comment (@MeldyRose):**
  > ### Review: Approved ✅
  >
  > The fixes in `272afc9` are **100% verified and correct**:
  >
  > 1. **`ShellNavigation.test.tsx`**: Unmocked paths now correctly return a `404` (`apiError(404, 'NOT_MOCKED', path)`) instead of a `200 []`. This prevents `StaffTicketDetail` from treating `[]` as a ticket object and completely resolves the unhandled `TypeError` in `PriorityBadge`.
  > 2. **`Hardening.test.tsx`**: Using `fill()` via `fireEvent.change` eliminates the slow key-by-key typing bottleneck during double-submit testing.
  > 3. **Timeouts in `setup.ts` & `vite.config.ts`**: Bumping `testTimeout` to 15 s and `asyncUtilTimeout` to 5 s is the right, pragmatic way to handle parallel jsdom load without having to rewrite older test suites.
  >
  > Everything in scope (health probe, timestamp formatting, double-submit guards, form preservation, clean cleanup, and the regression suites) is in place.
  >
  > LGTM — ready to merge into `lab4-staging`! 🎉

---

### [PR #100: Feat/lab4 e2e responsive screenshots](https://github.com/GGital/TocktickIT/pull/100) — `feat/lab4-e2e-responsive-screenshots`
- **Review Verdict:** `Approved`
- **My Comment (@MeldyRose):**
  > Rechecked the full PR against the Issue, `tests.md`, and `ui-spec.md` §14:
  >
  > - **E2E & Responsive**: All flows (E2E-01 to E2E-14) and responsive checks (RESP-01 to RESP-05) cover every AC across all three viewports without horizontal scroll.
  > - **Screenshots (§14)**: Verified all 33 states across `staff-dashboard`, `requester-dashboard`, `actions-taken`, and `ticket-workflow`. Exactly 97 PNGs accounted for, including the desktop-only `greyscale` exception.
  > - **Bug Fixes**: The fixes for `defaultActionAt` minute rounding, dialog focus return, and mobile modal CSS are clean and have targeted tests.
  > - **Regressions**: Lab 2 and Lab 3 suites continue to pass cleanly (147 total green).
  >
  > LGTM! Ready to merge into `lab4-staging`. :shipit:
- **Partner's Response (@GGital):** Merged into `lab4-staging`.
