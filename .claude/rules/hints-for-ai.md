# Hints for AI (monorepo-wide)

## Package manager: pnpm, not npm

This repo is a **pnpm workspace monorepo** — always use `pnpm`, never `npm` or `yarn`.

- Root scripts orchestrate packages via `pnpm --filter @spurro/<pkg>` (see root `package.json`).
- Run a package script: `pnpm --filter @spurro/backend <script>` or `cd backend && pnpm <script>`.
- Install: `pnpm install`. Add a dep: `pnpm --filter @spurro/<pkg> add <dep>`.
- Lockfile is `pnpm-lock.yaml`; workspace layout in `pnpm-workspace.yaml`. There is no `package-lock.json`.
