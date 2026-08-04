# Deferred work

Deliberately deferred items. Each entry names the trigger that turns it into required scope.

## Server full update (PUT /servers/{id})

The contract accepts the full `UpsertServer` payload, but `updateServerService` applies only `name` and `country`; `ip`, `domainName`, `endpoints`, and `credentials` are accepted and silently ignored. Applying them requires re-provisioning (a provision job for a changed ip/domain/endpoint set, credential rotation), which is not built yet.

The approved server-module test spec (2026-08-03) pins the current behavior: `name`/`country` applied, the full payload accepted without `BAD_REQUEST`, server status unchanged, credentials never exposed. When full update lands, replace those pinned cases with full-upsert semantics: applied `ip`/`domainName`, endpoint add/remove plus a provision job, credential rotation.

## Failed config cleanup frees the limit slot while the peer is live

When node-side config deletion fails (unreachable node), the config row stays in status `deleting`. `deleting` is excluded from `reservedConfigCondition`, so the user's config-limit slot is freed immediately — the user can allocate a replacement while the old peer is still active on the node, exceeding their real peer count until cleanup succeeds. Current behavior is pinned by tests (`toBe("deleting")`); whether the slot should instead stay held until cleanup completes is an open product decision.

## Server deletion does not touch the remote node

`DELETE /servers/{id}` only mutates the app DB (hard delete when no configs are reserved, soft delete otherwise). No teardown job or SSH cleanup runs against the node itself; the node keeps serving its VPN. Becomes required scope when node deprovisioning / lifecycle management is built.

## Soft server deletion silently hides user configs instead of marking them

`softDeleteServer` flips the server, its endpoints and every config on them to status `deleted`. Deleted configs are omitted from `GET /configs` and rejected by `GET /configs/{id}`, so from the user's perspective their config silently vanishes — indistinguishable from never having existed. The intended behavior (decided 2026-08-04) is the opposite: after a soft server deletion the config must stay visible in the user's list, marked as dead, so the user understands why their VPN stopped working.

Implementing the mark is a product change, not a test change. Open decisions: a dedicated config status (e.g. `orphaned`) versus exposing the server/endpoint status in the config contract; whether the limit slot stays freed immediately (current behavior) or only after the user dismisses the dead config; what `DELETE /configs/{id}` does for an orphaned config once the node no longer exists (no node call to make).

Current behavior is pinned end-to-end by "hides the user's configs after a soft server deletion" in `deleteServer.test.ts` — when the mark lands, that test must fail and be replaced together with this section.

## Server ip is not unique

Nothing stops two `server` rows from holding the same `ip` — no unique index (`ip` is `encryptedText`, and `encryptString` uses a random IV, so a plain unique index cannot work) and no check in `createServerService`. Two rows on one ip mean one physical machine registered twice: `endpoint_server_port_uq` is scoped to `serverId`, so both rows can claim the same port, and the second provision job overwrites the first one's node config.

Fixing it needs a deterministic HMAC-of-ip column under a partial unique index (`where status <> 'deleted'`, since deletion is soft and providers reuse ips). Deferred because server creation is admin-only, so this guards against an admin typo, not hostile input.

## No compatibility check for stored `data` against a changed contract

Nothing verifies that rows written under an older `data` shape survive a contract change. The read boundary is uneven: `ServerData`/`EndpointData` go through `safeParse` with `looseObject` schemas in query files (failure degrades to `null`), but `ConfigData` flows from the row into the route response with no read-side parse (`configSelection` → `createConfigFromDatabaseData`), where the strict `Amneziawg2ConfigDataSchema` in the contract validates it as oRPC output. A rename or a new required field in the contract makes every pre-change config row fail output validation at runtime — nothing in CI turns red before deploy. Existing `unknownField` tests cover request input only; test helpers always write the current shape, so fixtures silently track the schema and hide the breakage.

Options: golden fixtures — frozen raw `data` payloads for each shape that ever shipped, inserted into the database as-is and read back through routes (the direct answer); a schema snapshot test (`z.toJSONSchema`) enforcing additive-optional-only changes (the cheap guard); or a migration rule — any breaking shape change must ship with a data migration, shrinking the fixture set to current plus previous. Becomes required scope on the first non-additive change to any `data` schema.

## Function declaration style is not uniform in src

`src` mixes function declarations with arrow-assigned consts. Exported functions are declarations everywhere, but a handful of internal ones are arrows, so neither style is the rule.

`func-style: ["error", "declaration", { allowArrowFunctions: false }]` is enabled for `tests/**/*.ts` only (2026-08-04, together with the test-helper refactor). Pick one style for `src` — declarations or arrows — convert the outliers, and widen the rule to cover `src/**/*.ts` so it cannot drift again. Deferred because it touches worker step files unrelated to the test refactor that raised it.

## Worker jobs are excluded from the coverage requirement

Coverage runs on a deny list: everything under `src/**` must hit 100% except the entries in `filesWithoutCoverageRequirement` (`backend/vitest.config.ts`). Every entry there is code with nothing to assert — process entry points, table declarations, thin driver wrappers — except one: `src/worker/jobs/**`.

`provisionServerJob` and its steps (`resolveServerAccess`, `hardenSshAccess`, `scanSshHostKeys`, `resolveEndpointDeployments`, ...) have no tests at all, and they carry the riskiest behaviour in the system: SSH access to a fresh node and irreversible mutation of its state. The entry was added (2026-08-04) so the deny list could be introduced without blocking on that work — it records a debt, not a decision.

Becomes required scope as soon as worker tests land: delete the `src/worker/jobs/**` line and this section together. Until then the deny list must not be read as "these files do not need tests".
