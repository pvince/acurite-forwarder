# acurite-forwarder

Forwards Acurite requests to configured upstream HTTP and HTTPS targets.

## Commands

- `npm start` runs the forwarder with `ts-node`.
- `npm test` runs the unit test suite.
- `npm run test:coverage` runs the unit test suite with line-level coverage output.
- `npm run build` compiles the TypeScript sources to `dist/`.

## Coverage

- HTML coverage report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

The coverage workflow is configured to report uncovered source lines in `src/**/*.ts`, excluding local type declarations under `src/@types/`.