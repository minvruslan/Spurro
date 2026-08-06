# Hints for AI (monorepo-wide)

## Package manager: pnpm, not npm

This repo is a **pnpm workspace monorepo** — always use `pnpm`, never `npm` or `yarn`.

- Root scripts orchestrate packages via `pnpm --filter @spurro/<pkg>` (see root `package.json`).
- Run a package script: `pnpm --filter @spurro/backend <script>` or `cd backend && pnpm <script>`.
- Install: `pnpm install`. Add a dep: `pnpm --filter @spurro/<pkg> add <dep>`.
- Lockfile is `pnpm-lock.yaml`; workspace layout in `pnpm-workspace.yaml`. There is no `package-lock.json`.

## Backend tests

- Test file layout: root `describe` = protocol-independent flow; `describe("amneziawg2")` = tests coupled to the protocol implementation (to be mirrored per protocol); `describe("technical")` = states unreachable with honest data, via query-layer mocks. No other `describe` sections.
- One scenario → one test: identical arrange + act means ONE test asserting every consequence; the condition lives in the test name ("... when the node-side delete fails"). Separate tests are justified only by different arranges or triggers, never by different assertions on the same act.
- Every rejection path asserts the absence of side effects: no rows written or changed, no node calls (`not.toHaveBeenCalled()`). Every retry/cleanup path asserts the node call actually happened.
- Protocol identifiers only via `ProtocolCodeSchema.enum.*` / `ProtocolRegistry.*` — never string literals. Time offsets derive from the implementation constant (`CONSTANT + 1` minute), never magic numbers.
- Concurrency tests synchronize with deferred promises + `waitForDatabaseLockWaiter` — never `setTimeout`.
- HTTP-status tests exist only for statuses declared in the contract `.errors()`. Trivial oRPC codes are never tested per route: BAD_REQUEST from input-schema validation (non-uuid, missing/empty/too-long fields) and UNAUTHORIZED from the auth middleware are framework behavior, not module logic — auth is covered once in `backend/tests/src/api/orpc/authorized.test.ts`, and schema wiring is proven by any case that distinguishes a valid input (e.g. unknown-id NOT_FOUND).
- An HTTP success test exists only when the contract declares a custom `successStatus` (e.g. 201), and it asserts the status code alone — no schema parse, no field checks. Routes answering the default 200 get no HTTP success test at all. Response bodies are proven by `call()`-based tests, which run the same contract output validation.
- Response shapes are parsed with entity schemas imported from `@spurro/api-contract` — never redeclared locally in a test file. Route outputs the contract declares inline (e.g. `z.array(ConfigSchema)`, `z.object({ id: z.uuid() })`) are mirrored inline in the test; single-use output wrappers do not get named schemas in the contract.

## Backend database queries

- A query that returns a domain entity must use the shared selection from `backend/src/core/database/selections` and the module's `createXFromDatabaseData` util — never assemble an entity with an ad-hoc projection.
- A narrow technical lookup (count, single field, node access data) defines its minimal projection locally in the query file and does not go into `selections`.
