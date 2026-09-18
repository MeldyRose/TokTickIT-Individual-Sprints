# Lab 3 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.6 Flash)

## Selected Key Prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| **1** | Before touching any code, I asked the AI to read all the spec files (`api-spec.md`, `ui-spec.md`, etc.) without editing files, and lay out a clear step-by-step roadmap for the project. | I checked the plan and used it to split the work into clear phases (database, backend APIs, UI, and testing) before starting to write code. |
| **2** | I asked it to set up the database models (`Ticket`, `Requester`, `Category`, etc.) and seed data in Prisma, but locked the changes to the `feature/6-database-schema-seed` branch. | I ran the Prisma migrations and seed script to get the database up and running for the backend API work. |
| **3** | While waiting for my Phase 1 PR to get reviewed, I asked if we could start building backend endpoints and UI components on separate branches in parallel. | I set up the recommended branch workflow so I could keep making progress on the backend and frontend without getting blocked waiting for PR approval. |
| **4** | I pulled context from an earlier chat and asked it to design the NestJS endpoints and request validation rules (DTOs) based on `api-spec.md`. | I plugged the validation DTOs and error handlers into NestJS to make sure all incoming API requests are checked and formatted correctly. |
| **5** | I gave it a list of UI components to build (buttons, dropdowns, forms, skeleton loaders) and asked it to map our custom theme CSS (`zen-theme.css`) to Bootstrap variables. | I used these reusable React components across the frontend to keep the design and layout consistent across all pages. |
| **6** | I asked it to run all our unit and integration tests to verify everything was working and catch any regressions. | I fixed a couple of failing test cases, made sure the whole test suite passed cleanly, and pushed my code with confidence. |
| **7** | I gave it our updated data structure (models, enums, foreign keys) and asked it to split the schema changes into two clean database migration steps. | I ran the migrations step-by-step in Prisma and added foreign key indexes to keep database queries running fast. |
---

## My Reflection

Using AI as a pair-programmer throughout this project showed me that the quality of the AI's output directly depends on how clear and specific your boundaries are. 

Here are my main takeaways from the experience:

* **Setting strict boundaries prevents messy code:** Telling the AI explicitly what *not* to touch (like keeping planning sessions read-only or locking edits to a specific Git branch) saved me from accidental breaking changes and kept my repository clean.
* **Planning first saved hours of debugging:** Taking a step back to have the AI digest all specification files (`api-spec.md`, `ui-spec.md`, etc.) and output a phased plan before writing code made the actual implementation much smoother and avoided rework.
* **Great for unblocking workflow strategies:** Beyond just writing code, using the AI to brainstorm parallel branching strategies while waiting on PR reviews helped keep momentum going across both backend and frontend tasks.
* **Human oversight is still essential:** While AI sped up writing repetitive code like DTO validations, database seed scripts, and UI component boilerplate, I still needed to review the outputs, run real migration steps, and verify test cases to make sure everything actually worked in practice.
