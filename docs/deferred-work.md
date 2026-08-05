# Deferred work

Deliberately deferred items. Each entry names the trigger that turns it into required scope.

## Failed config cleanup frees the limit slot while the peer is live

When node-side config deletion fails (unreachable node), the config row stays in status `deleting`. `deleting` is excluded from `reservedConfigCondition`, so the user's config-limit slot is freed immediately — the user can allocate a replacement while the old peer is still active on the node, exceeding their real peer count until cleanup succeeds. Current behavior is pinned by tests (`toBe("deleting")`); whether the slot should instead stay held until cleanup completes is an open product decision.

## Server ip is not unique

Nothing stops two `server` rows from holding the same `ip` — no unique index (`ip` is `encryptedText`, and `encryptString` uses a random IV, so a plain unique index cannot work) and no check in `createServerService`. Two rows on one ip mean one physical machine registered twice: `endpoint_server_port_uq` is scoped to `serverId`, so both rows can claim the same port, and the second provision job overwrites the first one's node config.

Fixing it needs a deterministic HMAC-of-ip column under a unique index. Deferred because server creation is admin-only, so this guards against an admin typo, not hostile input.

## No compatibility check for stored `data` against a changed contract

Nothing verifies that rows written under an older `data` shape survive a contract change. The read boundary is uneven: `ServerData`/`EndpointData` go through `safeParse` with `looseObject` schemas in query files (failure degrades to `null`), but `ConfigData` flows from the row into the route response with no read-side parse (`configSelection` → `createConfigFromDatabaseData`), where the strict `Amneziawg2ConfigDataSchema` in the contract validates it as oRPC output. A rename or a new required field in the contract makes every pre-change config row fail output validation at runtime — nothing in CI turns red before deploy. Existing `unknownField` tests cover request input only; test helpers always write the current shape, so fixtures silently track the schema and hide the breakage.

Options: golden fixtures — frozen raw `data` payloads for each shape that ever shipped, inserted into the database as-is and read back through routes (the direct answer); a schema snapshot test (`z.toJSONSchema`) enforcing additive-optional-only changes (the cheap guard); or a migration rule — any breaking shape change must ship with a data migration, shrinking the fixture set to current plus previous. Becomes required scope on the first non-additive change to any `data` schema.

## Function declaration style is not uniform in src

`src` mixes function declarations with arrow-assigned consts. Exported functions are declarations everywhere, but a handful of internal ones are arrows, so neither style is the rule.

`func-style: ["error", "declaration", { allowArrowFunctions: false }]` is enabled for `tests/**/*.ts` only (2026-08-04, together with the test-helper refactor). Pick one style for `src` — declarations or arrows — convert the outliers, and widen the rule to cover `src/**/*.ts` so it cannot drift again. Deferred because it touches worker step files unrelated to the test refactor that raised it.
