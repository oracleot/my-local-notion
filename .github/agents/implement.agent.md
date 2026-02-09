---
description: Implement a task end-to-end from the user's request (explore codebase, change code, validate, recap).
---

## User Input

```text
$ARGUMENTS
```

You MUST treat the user input as the source of truth. If it is empty or ambiguous, ask focused clarifying questions before making large changes.

## Goal

Implement the requested change in the current repository, making the smallest correct set of edits, and verifying the result.

## Operating Principles

- Be precise and scoped: implement exactly what the user asked. Do not add “nice-to-haves” or extra UI beyond the spec.
- Fix root causes where feasible; avoid superficial patches.
- Respect existing conventions, file structure, and design system.
- Prefer composition over monoliths.

## Hard Repo Constraints

- CRITICAL: Never create or allow any component/file/module to exceed 200 lines of code.
  - If approaching ~150 lines, refactor immediately into smaller components/hooks/utils.
- Do not introduce new colors, font families, shadows, or visual themes unless explicitly requested.

## Git Branching (Mandatory)

Before you change any code, you MUST get the latest changes from main first, then work on a spec branch tied to the spec file you are implementing.

- Determine the spec file you are working from (ask the user if it is not explicit).
- Checkout (or create) a branch named exactly:
	- `spec/<spec-file-base-name>`
	- Example: for `ideas/specs/focus-mode-tweaks.md`, use branch `spec/focus-mode-tweaks`.
- If you are already on the correct branch, continue.
- Do NOT implement on `main` (or any non-spec branch).

## Workflow (Follow in Order)


0. Spec Branch
	- Checkout to main and pull the latest changes.
	- Identify the spec file you are implementing.
	- Checkout to `spec/<spec-file-base-name>` before doing anything else.
	- If needed, create the branch.

1. Understand
	- Restate the task in one sentence.
	- Identify acceptance criteria (what “done” means).
	- If requirements are unclear, ask up to 1–3 questions (or choose the simplest reasonable default and state it).

2. Discover
	- Locate the relevant files, components, routes, stores, and types.
	- Identify existing patterns you should follow (state management, UI primitives, data layer).

3. Plan (only when non-trivial)
	- Use a short checklist/plan with 3–6 steps.
	- Keep plan steps verifiable.

4. Implement
	- Make minimal, consistent changes.
	- Prefer extracting helpers/hooks for complex logic.
	- Keep components small and focused.

5. Validate
	- Run the most relevant checks available (typecheck, lint, unit/e2e, build).
	- If tests are absent, do a targeted manual sanity pass (describe what to click/verify).
	- Do not fix unrelated failures; mention them separately.

6. Recap
	- Summarize what changed, where, and how to verify.
	- Call out any tradeoffs/risks and next optional steps.

## Skill Usage

- If the task involves UI/UX/layout/styling, load and apply the frontend-design skill instructions from its SKILL.md.
- If the task involves Next.js/React performance patterns, apply vercel-react-best-practices.
- If the task involves Supabase/Postgres/schema/query work, apply supabase-postgres-best-practices.

## Tooling Expectations

- Prefer repository search tools to find code paths rather than guessing.
- Use patch-based edits for existing files.
- Use the clarification tool when you cannot safely infer intent.
- After edits, check for new diagnostics/errors related to your changes.