# Lab 2 — AI Use and Reflection  (fill this in)

**LLM/agent used:** Antigravity

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Do not modify or create anything. Write me issues markdown to kanban board which includes goals, scope, acceptance criteria for each phases. Mainly base on the PDF file and md files in `docs\lab-02`. | Used the structured Markdown breakdown to populate GitHub issues/Kanban cards to track sprint phases across separate feature branches before starting implementation. |
| 2 | From Lab2 pdf file and lab-02 `specification.`,`tests.md`,`ui-spec.md`,`api-spec.md`, Do not change anything. Inform me what should be the next plan after done writing documents. | Evaluated the technical dependency roadmap across all spec files and approved initiating Phase 1 (Database Schema & Seed Data) implementation on `feature/6-database-schema-seed`. |
| 3 | Shorten the PR comment and the verdict. Make it looks human comment as possible. Write them as comments and little bullet | Copied the humanized bulleted PR comment and verdict directly into the GitHub Pull Request review section for peer submission. |
| 4 | This is a question. Do not modify anything. From the steps after document, Can you do phase 2 and 3 without the need to finish phase 1? | Used the architectural dependency analysis to decide to finish and submit Phase 1 for PR review before branching into Phase 2 (Backend API) and Phase 3 (Frontend). |
| 5 | Please proceed from the plan that create the branch as feature 10 and name it according to the issue create this branch from `lab2-staging`. Do not modify anything irrelevant. Do not modify anything in `docs\` and Do not merge anything. When its done, report me about it. | Had the assistant execute Feature 10 (ticket detail/attachment API) isolated in `feature/10-ticket-detail` while protecting docs/ from unintended modifications. |
| 6 | Do not change any files, just check from the criteria and summarize it for me | Reviewed the read-only acceptance criteria checklist for Feature 4 / Issue 4 to ensure 100% compliance without dirtying the working directory before submitting the PR. |
| 7 | Please explain why do you use `shadowDatabaseUrl` for `SHADOW_DATABASE_URL`? | Understood Prisma shadow database mechanics, requested a PR response template, and replied professionally to peer code review comments on GitHub. |

## Reflection

Looking back at my prompts across TokTickIT, I used the AI to stay organized while keeping total control over my code:

- Strict Guardrails: I set clear boundaries like "do not modify anything" to safely inspect code and check criteria without accidental changes.
- Planning First: I had the AI convert complex spec docs into clean Kanban cards and sprint phases before writing code.
- Pacing & Dependencies: I checked branch dependencies first to ensure Phase 1 was ready before moving to Phase 2 or 3.
- Humanized PRs: I asked to shorten and simplify AI outputs so my GitHub PR reviews felt natural and genuine.
- Overall, I used the AI to plan quickly and review cleanly, while keeping full ownership of my project.