---
description: "Use when implementing or modifying acurite-forwarder features; enforces build verification and config impact checks."
name: "Forwarder Feature Change Checklist"
argument-hint: "Describe the feature change to implement"
agent: "agent"
---

Implement the requested feature change for this repository: ${input:Describe the feature change to implement}.

Follow this checklist in order:

1. Identify impacted files and summarize intended behavior changes before editing.
2. Strict TDD step 1: Write test(s) first for the new functionality.
   - Include happy path coverage.
   - Include edge case coverage.
   - Include potential gotcha/regression coverage.
3. Strict TDD step 2: Run tests and verify the new test(s) fail for the expected reason.
4. Strict TDD step 3: Implement the smallest set of code changes required.
5. Strict TDD step 4: Run tests again and verify all relevant tests pass.
6. Verify TypeScript and lint-driven constraints from [.eslintrc](../../.eslintrc) are respected.
7. Run build verification with `npm run build` without asking for explicit permission.
8. Perform a configuration impact check:
   - Confirm whether runtime configuration keys or behavior changed.
   - If yes, update [config.example.json](../../config.example.json) to stay aligned.
   - If no, explicitly state that no config contract changes were introduced.
9. Provide a final summary with:
   - Files changed
   - TDD evidence (tests added, initial failing run, final passing run)
   - Build result
   - Config impact result
   - Any follow-up risks or TODOs

Additional constraints:

- Keep behavior unchanged outside requested scope.
- Preserve existing project patterns in [src/app.ts](../../src/app.ts) and [src/certificateManager.ts](../../src/certificateManager.ts).
- If a requested change implies architecture-level refactoring, call that out before proceeding.
