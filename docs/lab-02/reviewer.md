# Lab 2 — Peer Review Record  (fill this in)

**Author:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: @MeldyRose
**Peer reviewer:** Phattaratorn Mahatkeerati — 67070503433 — GitHub: @GGital

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|  14  | feature/5-lab2-specification | - All six required documentation files exist under docs/lab-02/. - specification.md contains requirements, business rules, Acceptance Criteria, and Definition of Done. - tests.md contains the planned test cases and Acceptance Criteria traceability. - ui-spec.md defines the required UI behavior and responsive rules. - api-spec.md defines the required API contracts. - reviewer.md contains the structure needed to record peer review evidence. - ai-use.md contains the structure needed to record AI usage and reflection. - the specification is completed before the main implementation work. - No implementation beyond the setup/specification work is included in this branch. |
|  16  | feature/6-database-schema-seed | - Prisma schema validates successfully. - Migration applies successfully. - Seed script runs successfully. - Required seed data is created correctly. - Existing Lab 1 functionality is not affected. This good to be merged. Anyways, lab 1 tests are still not updated to test the new seeded database and verify the schema. To complete this task perfectly and make the development of this project to remain on the concept of test-driven development, test files should be updated to verify the result in the later feature branch. 👍 Nice works! |
|  22  | feature/7-requester-context-selection-screen | I have tested added UI components and API in this branch, and it is working correctly.
The website can verify and give the feedback about the state of the database and API as well. This is good to be merged! :) <img width="1911" height="872" alt="Image" src="https://github.com/user-attachments/assets/95942eb6-bad6-47bd-b2c0-254a32e4b6ab" /> <img width="1912" height="877" alt="Image" src="https://github.com/user-attachments/assets/647d409a-b5e9-4f96-ab9b-a0a74768d6e2" /> <img width="1912" height="876" alt="Image" src="https://github.com/user-attachments/assets/a4c13ac3-5b36-42ee-967c-d2592d2b6a76" /> |
|  23  | feature/8-ticket-creation-my-tickets | I have read the code and test the functionality of adding a ticket on the webpage.
The API is correctly retrieving seeded data from the database to make LOV as expected, and able to add new ticket on it.
The UI is using the Zen green color theme as defined as one of the acceptance criteria. Nice work! Keep going! <img width="1906" height="877" alt="Image" src="https://github.com/user-attachments/assets/7b32429a-021f-4ba0-8011-dfc6d12d5911" /> Form view for creating new ticket <img width="1912" height="876" alt="image" src="https://github.com/user-attachments/assets/847830dd-f0b4-48f5-b93a-39015f52facd" /> |
|  24  | feature/9-requester-ticket-detail | I have verified the API endpoint used to create the new ticket has the header "X-Requester-Id" used correctly as expected. Also, the responsive screen is perfect for mobile or tablet user. I think the functionality required for this issue is complete and good to be merged. Note: I have found that there are some features meant to be part of previously requested PR. It would be better to focus on just a requested features presented in the issue next time to prevent the conflict for merging into the `lab2-staging`. Screenshots: <img width="267" height="582" alt="Image" src="https://github.com/user-attachments/assets/c333c8b4-f38a-47e9-9979-3a06d2d3a83d" /> |
|  25  | feature/10-ticket-detail-attachments | Approved ✅
Verified the requester ownership scoping, attachment lifecycle (upload → metadata → download → soft-remove) by interacting with the endpoint directly. Here is the screenshot of the result <img width="1911" height="857" alt="Image" src="https://github.com/user-attachments/assets/5767cdbe-01c6-4a45-b69f-aca0b73aadbf" /> <img width="1910" height="867" alt="Image" src="https://github.com/user-attachments/assets/5f2c209e-d8ff-4b7e-81c7-94a3e2211168" /> |

Feature 6(database-schema-seed)
How I responded: After I recieve recommendation,I modify further on the specific part and comment back as "Hey! Thank you for approving. Even though the PR is approved but I decided to update the lab 1 tests. It will be great if you can recheck my update."

## Pull Requests I reviewed for my partner

docs/lab2-specification-drafting 
My comment: Looks great! I went through all three spec docs (specification.md, api-spec.md, and ui-spec.md) and found that the scope is well-defined. It is covering the test requester selector, ticket workflows, attachments, and Zen Green UI specs, while correctly excluding real auth, staff features, comments, and post-creation status changes. Business rules, backend ownership checks, and API contracts are clear and consistent across all files.

Ready to merge into lab2-staging!
Partner's response: -

feat/lab2-data-model-migrations-seed
My comment: Checked everything and this is ready to go!

- Schema models, enums, and `Category.isActive` default are correctly implemented per BR-45 & BR-49.
- Foreign keys, unique constraints, and indexes match all spec requirements.
- Migrations are cleanly split into two steps.
- Seed script is idempotent with 4 categories, 7 systems, and 5 requesters.
- `server/uploads/` is git-ignored with `.gitkeep` retained.

Approved and ready to merge!
Partner's response: -

feat/zen-green-foundation
My comment: Approved!
Checked everything agaisnt the requirements and this looks great to merge!

- zen-theme.css keeps all colors in one place as requested (AC-46).
- All UI components (Button, Badge, Callout, FormField, inputs, Skeletons, EmptyState, Pagination, ConfirmDialog) work as expected and follow design rules.
- ConfirmDialog uses built-in browser popups with setup.ts added for testing.
- AppRoutes has all necessary page routes while keeping the /system-check page working (BR-43, AC-44).
- Tests STYLE-01 to 08 pass and check AC-46, AC-48, and FR-33.
Partner's response: -

feat/lab2-context-reference-api
My comment:Approved!
I've checked out the branch and confirmed working tree is clean.

- `errors.ts` : Confirmed 15 erro codes with bound HTTP status, exclusion of status 401, and unified error envelope.
- `requesterContext.ts`: Confirmed digit validation for `X-Requester-Id` (400) and query filtering for inactive/unknown requesters (403).
- `app.ts`: Confirmed active filtering and ordering on `/api/categories`, `/api/related-systems`, and `/api/requesters` (no `isActive` in projection), global `Cache-Control: no-store` header, and safe 500 error handling.
- Lab 1 Migration: Verified updated category error test in `tests/lab-01/API-02.categories.test.ts`.
- Documentation: Verified test mapping in `docs/lab-02/tests.md`.

For test execution, it results as 6/6 tests files passed (22/22 tests.)
Partner's response: -

feat/lab2-requester-selection
My comment:LGTM! All requirements from AC-01 - AC-07, AC-50 and BR-08, BR-10, BR-12, BR-48, BR-50 are fully satisfied and tested.

- Storage module correctly saves `toktickit.requesterId` and syncs UI components using `useSyncExternalStore`.
- API client attaches `X-Requester-Id` header and automatically resets context on `403` error.
- Selection screen displays all 6 UI states and includes the required testing disclaimer.
- Route guard and app shell successfully protect tickets routes and show the current testing identity.
- All 26 automated unit and component tests ran and passed cleanly.
Partner's response: -

feat/lab2-create-ticket-api
My comment: APPROVED!

- `POST /api/tickets` correctly implements atomic `TKT-YYYY-NNNNNN` counter using `Asia/Bangkok` timezone.
- Multi-field input validation returns all offending fields at once; strings trimmed; priority never defaulted.
- 60-second per-requester duplicate submission guard returns `409 DUPLICATE_SUBMISSION`.
- Reference data states (unknown vs inactive) remain non-enumerable.
- All 41 tests passed cleanly (`UNIT-01–03`, `API-09–20`).
Partner's response: -

feat/lab2-attachment-api
My comment: Looks awesome! Approved 👍

- Tested branch feat/lab2-attachment-api and ran npm test in server/ (77/77 tests passing).
- File type validation and magic-byte checks work nicely, blocking invalid or disguised files.
- UUID storage prevents path traversal and keeps the filesystem safe.
- The 5 MB file size limit is working as expected (5 MB works, oversized files get blocked).
- Ownership checks run before file processing so non-owners get a simple 404 response.
- Failed DB saves clean up files automatically, and soft removal correctly returns 410 on download.

Nice job on this! Ready to merge.
Partner's response: -

feat/lab2-my-tickets-api
My comment: APPROVED!

- Verified all server (69) and client (26) tests pass.
- Returns an error for bad or duplicate inputs instead of guessing or ignoring them.
- DB queries scope by `requesterId` directly for strict ownership isolation.
- Counts and gets tickets in one transaction so total items and page numbers always match.
- Priority sorts by severity (URGENT to LOW) with stable id desc secondary sort.
- `attachmentCount` correctly excludes soft-removed files.
- Test plan updated: UNIT-09, UNIT-10, and API-21 to API-29 marked Pass.
Partner's response: -

feature/lab2-create-ticket-ui
My comment: I approved! Nice work on this PR!
I have : 

- Verified all 4 card sections on /tickets/new in specified order with system fields set to read-only, default MEDIUM priority, and live character counters.
- Checked all 9 UI states (§5.3); form validation places focus on the first invalid field, blocks requests, and preserves all user inputs/staged files on failure.
- Verified attachment staging logic: per-file error handling, 5-file limit lockout, truncation title tooltips, and post-creation uploads with retry links.
- Ran client test suite (npm test): 11 test files and 51 tests all passed cleanly (covering UNIT-11, UI-07–15, UI-25, STYLE-02–04).
- Verified docs/lab-02/tests.md matrix has been updated with Pass statuses for covered test IDs.
Partner's response: -

feature/lab2-my-tickets-ui
My comment: LGTM! 

- Tested on feature/lab2-my-tickets-ui branch and all tests pass (UI-16 to UI-19). 
- Verified toolbar filters, 350ms search debounce, explicit page=1 reset, and responsive layout. 
- Dim-on-refetch, error callout, and distinct empty vs no-results states all work properly.
- Confirmed the pendingReset fix prevents requester parameter leaks.

I approved!
Partner's response: -

feature/lab2-ticket-detail
My comment: I approved!

### Deliverables Verified

- **Playwright Config:** Added automated dual-server startup for `:3000` and `:5173`, with single-worker isolation in `playwright.config.ts`.
- **E2E Tests:** Added 38 tests across 7 spec files under `e2e/lab-02/`, covering E2E-01–08 and RESP-01–06.
- **Screenshots:** Added 63 committed PNG screenshots covering 3 different viewports in `artifacts/lab-02/screenshots/`.
- **App Fix:** Added `apiFetchBlob` to `apiClient.ts` so attachment downloads and previews correctly send the required context headers. All 64 client tests are passing.
- **Documentation:** Updated `docs/lab-02/tests.md` with `Pass` results for RESP-01–07 and E2E-01–08.

### Final Result

Everything has been verified and is ready to merge into `lab2-staging`.
Partner's response: -