---
description: "Use when refactoring acurite-forwarder code; enforces strict pass-before/pass-after TDD workflow, plus build and config impact checks."
name: "Forwarder Refactor Checklist"
argument-hint: "Describe the code to refactor and constraints"
agent: "agent"
---

Perform a refactor for this repository: ${input:Describe the code to refactor and constraints}.

Follow this checklist in order:

1. Define the refactor scope and explicitly confirm no intended behavior changes.
2. Strict TDD step 1: Write test(s) covering all functionality to be refactored.
3. Strict TDD step 2: Run tests and verify the test(s) pass before refactoring.
4. Strict TDD step 3: Perform the refactor with no functional changes.
5. Strict TDD step 4: Run tests again and verify test(s) still pass after refactoring.
6. Verify TypeScript and lint-driven constraints from [.eslintrc](../../.eslintrc) are respected.
7. Run build verification with `npm run build` without asking for explicit permission.
8. Perform a configuration impact check:
   - Confirm whether runtime configuration keys or behavior changed.
   - If yes, update [config.example.json](../../config.example.json) to stay aligned.
   - If no, explicitly state that no config contract changes were introduced.
9. Provide a final summary with:
   - Files changed
   - Refactor scope and invariants
   - TDD evidence (pre-refactor passing run and post-refactor passing run)
   - Build result
   - Config impact result
   - Residual risks or TODOs

Additional constraints:

- Do not mix feature work into refactor changes.
- Keep behavior unchanged outside refactor scope.
- Preserve existing project patterns in [src/app.ts](../../src/app.ts) and [src/certificateManager.ts](../../src/certificateManager.ts).
