# AGENTS.md

This file helps AI coding agents become productive quickly in this repository.

## Project Purpose

`acurite-forwarder` forwards incoming Acurite traffic to configured upstream targets over both HTTP and HTTPS.

## Canonical References

- Main docs: [README.md](README.md)
- Runtime config template: [config.example.json](config.example.json)
- Build/runtime metadata: [package.json](package.json)
- TypeScript compiler settings: [tsconfig.json](tsconfig.json)
- Lint and style rules: [.eslintrc](.eslintrc)

Link to these files when explaining behavior; do not duplicate long sections from them.

## Quick Start Commands

- Install dependencies: `npm install`
- Build TypeScript: `npm run build`
- Start forwarder: `npm start`

Notes:
- `npm start` runs `node --tls-min-v1.0 -r ts-node/register src/app.ts`.
- There is no test script in `package.json` yet.

## Architecture Map

- App entrypoint: [src/app.ts](src/app.ts)
  - Loads `config.json`
  - Starts HTTP forwarder (port 80)
  - Starts HTTPS forwarder (port 443)
  - Logs forwarding events
- Certificate lifecycle: [src/certificateManager.ts](src/certificateManager.ts)
  - Reads cert/key from `certs/ssl.cert` and `certs/ssl.key`
  - Generates self-signed certs if missing
- Third-party type augmentation: [src/@types/forwarder-http/index.d.ts](src/@types/forwarder-http/index.d.ts)
  - Local typings for `forwarder-http`

## Repo-Specific Conventions

Follow `.eslintrc` strictly. Important rules for edits:

- Add explicit function return types.
- Keep JSDoc for class/method/type signatures as required.
- Use explicit member accessibility in classes.
- Prefer `const` when possible.
- Use single quotes and semicolons.
- Avoid introducing `any`; prefer concrete or unknown + narrowing.

Before finalizing changes, run:

- `npm run build`

## Operational Pitfalls

- `config.json` is required at runtime. Use [config.example.json](config.example.json) as the template.
- HTTPS cert common name is currently hardcoded in [src/certificateManager.ts](src/certificateManager.ts).
- Forwarder target options currently use `rejectUnauthorized: false` for upstream calls.
- The service binds to ports 80 and 443; local runs may require elevated privileges.

## Agent Workflow Expectations

- Keep changes minimal and localized to the request.
- Preserve current architecture (single-process startup with HTTP + HTTPS forwarders) unless explicitly asked to redesign.
- If behavior is already documented in repo files, link to those files instead of restating full docs.
- If adding tests/scripts, also update `package.json` scripts and document usage in [README.md](README.md).
- Run `npm run build` as part of verification without requiring explicit user permission.