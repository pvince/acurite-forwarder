---
description: "Use when fixing acurite-forwarder bugs; enforces reproduction notes, build verification, and config impact checks."
name: "Forwarder Bugfix Checklist"
argument-hint: "Describe the bug and expected behavior"
agent: "agent"
---

Implement a bugfix for this repository: ${input:Describe the bug and expected behavior}.

Follow this checklist in order:

1. State the observed behavior, expected behavior, and likely root cause.
2. Identify impacted files and the minimum viable fix scope.
3. Strict TDD step 1: Write test(s) that reproduce the bug before changing code.
4. Strict TDD step 2: Run tests and verify the new test(s) fail for the expected reason.
5. Strict TDD step 3: Implement the smallest safe fix without broad refactors.
6. Strict TDD step 4: Run tests again and verify all relevant tests pass.
7. Check for regressions in nearby request forwarding, response handling, and certificate/config flows.
8. Run build verification with `npm run build` without asking for explicit permission.
9. Perform a configuration impact check:
   - Confirm whether runtime configuration keys or behavior changed.
   - If yes, update [config.example.json](../../config.example.json) to stay aligned.
   - If no, explicitly state that no config contract changes were introduced.
10. Provide a final summary with:
   - Files changed
   - Root cause and fix summary
   - TDD evidence (tests added, initial failing run, final passing run)
   - Build result
   - Config impact result
   - Residual risks or follow-up TODOs

Additional constraints:

- Keep behavior unchanged outside the fix scope.
- Preserve existing project patterns in [src/app.ts](../../src/app.ts) and [src/certificateManager.ts](../../src/certificateManager.ts).
- If the fix requires architecture-level changes, call that out before proceeding.
