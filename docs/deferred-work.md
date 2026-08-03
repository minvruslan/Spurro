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
