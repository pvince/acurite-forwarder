---
description: "Use when editing TypeScript source files under src/, enforcing strict ESLint and JSDoc requirements for this repository."
name: "TypeScript ESLint and JSDoc Guardrails"
applyTo: "src/**/*.ts"
---

# TypeScript ESLint and JSDoc Guardrails

Use this instruction for code changes in `src/**/*.ts`.

## Required Standards

- Follow repository lint rules in [.eslintrc](../../.eslintrc).
- Use explicit return types on all functions and methods.
- Keep required JSDoc blocks for classes, methods, interfaces, type aliases, enums, and property signatures.
- Use explicit member accessibility for class members.
- Prefer `const` and avoid unnecessary `let`.
- Use single quotes and semicolons.
- Avoid `any`; use concrete types or `unknown` with narrowing.

## Edit Checklist

- Preserve existing architecture and behavior unless the request explicitly asks for a change.
- Keep changes minimal and localized to the requested scope.
- If adding new public behavior, include or update type definitions as needed.
- If `config.json` behavior is impacted, update [config.example.json](../../config.example.json) and mention it in the change summary.

## Verification

- Always run `npm run build` after TypeScript edits.
- Do not ask for explicit permission before running `npm run build`.
- If build fails, fix issues introduced by your changes before finishing.
