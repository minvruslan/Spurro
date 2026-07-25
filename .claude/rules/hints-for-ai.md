# Hints for AI (monorepo-wide)

## Package manager: pnpm, not npm

This repo is a **pnpm workspace monorepo** — always use `pnpm`, never `npm` or `yarn`.

- Root scripts orchestrate packages via `pnpm --filter @spurro/<pkg>` (see root `package.json`).
- Run a package script: `pnpm --filter @spurro/backend <script>` or `cd backend && pnpm <script>`.
- Install: `pnpm install`. Add a dep: `pnpm --filter @spurro/<pkg> add <dep>`.
- Lockfile is `pnpm-lock.yaml`; workspace layout in `pnpm-workspace.yaml`. There is no `package-lock.json`.

## Backend database queries

- A query that returns a domain entity must use the shared selection from `backend/src/core/database/selections` and the module's `createXFromDatabaseData` util — never assemble an entity with an ad-hoc projection.
- A narrow technical lookup (count, single field, node access data) defines its minimal projection locally in the query file and does not go into `selections`.
