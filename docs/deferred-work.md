# Deferred work

Deliberately deferred items. Each entry names the trigger that turns it into required scope.

## Server full update (PUT /servers/{id})

The contract accepts the full `UpsertServer` payload, but `updateServerService` applies only `name` and `country`; `ip`, `domainName`, `endpoints`, and `credentials` are accepted and silently ignored. Applying them requires re-provisioning (a provision job for a changed ip/domain/endpoint set, credential rotation), which is not built yet.

The approved server-module test spec (2026-08-03) pins the current behavior: `name`/`country` applied, the full payload accepted without `BAD_REQUEST`, server status unchanged, credentials never exposed. When full update lands, replace those pinned cases with full-upsert semantics: applied `ip`/`domainName`, endpoint add/remove plus a provision job, credential rotation.

## Server deletion advisory lock has no race test

`deleteServerService` takes `pg_advisory_xact_lock(hashtext(serverId))` to serialize server deletion against concurrent config issuance on the same server (`createUserConfigService` takes the same lock). This is deliberately untested: a route-level race test requires pausing one transaction mid-flight via mocks and asserting on timing, which is fragile and violates the route-level testing rule. If the lock is ever removed, nothing red will say so.

## Failed config cleanup frees the limit slot while the peer is live

When node-side config deletion fails (unreachable node), the config row stays in status `deleting`. `deleting` is excluded from `reservedConfigCondition`, so the user's config-limit slot is freed immediately — the user can allocate a replacement while the old peer is still active on the node, exceeding their real peer count until cleanup succeeds. Current behavior is pinned by tests (`toBe("deleting")`); whether the slot should instead stay held until cleanup completes is an open product decision.

## Server deletion does not touch the remote node

`DELETE /servers/{id}` only mutates the app DB (hard delete when no configs are reserved, soft delete otherwise). No teardown job or SSH cleanup runs against the node itself; the node keeps serving its VPN. Becomes required scope when node deprovisioning / lifecycle management is built.

## Server ip is not unique

Nothing stops two `server` rows from holding the same `ip` — no unique index (`ip` is `encryptedText`, and `encryptString` uses a random IV, so a plain unique index cannot work) and no check in `createServerService`. Two rows on one ip mean one physical machine registered twice: `endpoint_server_port_uq` is scoped to `serverId`, so both rows can claim the same port, and the second provision job overwrites the first one's node config.

Fixing it needs a deterministic HMAC-of-ip column under a partial unique index (`where status <> 'deleted'`, since deletion is soft and providers reuse ips). Deferred because server creation is admin-only, so this guards against an admin typo, not hostile input.

## Function declaration style is not uniform in src

`src` mixes function declarations with arrow-assigned consts. Exported functions are declarations everywhere, but a handful of internal ones are arrows, so neither style is the rule.

`func-style: ["error", "declaration", { allowArrowFunctions: false }]` is enabled for `tests/**/*.ts` only (2026-08-04, together with the test-helper refactor). Pick one style for `src` — declarations or arrows — convert the outliers, and widen the rule to cover `src/**/*.ts` so it cannot drift again. Deferred because it touches worker step files unrelated to the test refactor that raised it.
