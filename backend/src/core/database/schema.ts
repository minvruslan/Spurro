import { relations, sql } from "drizzle-orm"
import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
  uniqueIndex,
  pgEnum,
  check,
} from "drizzle-orm/pg-core"
import { user } from "./auth-schema"

// ─────────── enums ───────────

export const serverStatus = pgEnum("server_status", ["provisioning", "active", "deleted"])
export const endpointStatus = pgEnum("endpoint_status", ["active", "deleted"])
export const grantStatus = pgEnum("grant_status", ["active", "deleted"])

// ─────────── catalog ───────────

export const protocolType = pgTable("protocol_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const protocol = pgTable(
  "protocol",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    protocolTypeId: uuid("protocol_type_id")
      .notNull()
      .references(() => protocolType.id, { onDelete: "restrict" }),
    version: text("version").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("protocol_type_version_uq").on(t.protocolTypeId, t.version),
    index("protocol_type_idx").on(t.protocolTypeId),
  ],
)

export const deviceType = pgTable(
  "device_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    check(
      "device_type_code_check",
      sql`${t.code} in ('ios', 'macos', 'windows', 'linux', 'android')`,
    ),
    check(
      "device_type_name_check",
      sql`${t.name} in ('iOS', 'macOS', 'Windows', 'Linux', 'Android')`,
    ),
  ],
)

// ─────────── limits ───────────

export const userLimit = pgTable(
  "user_limit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    protocolTypeId: uuid("protocol_type_id")
      .notNull()
      .references(() => protocolType.id, { onDelete: "restrict" }),
    maxCount: integer("max_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("user_limit_user_type_uq").on(t.userId, t.protocolTypeId)],
)

// ─────────── infrastructure ───────────

export const server = pgTable(
  "server",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    domainName: text("domain_name").notNull(),
    ip: text("ip").notNull(),
    country: text("country").notNull(),
    status: serverStatus("status").default("active").notNull(),
    isCurrent: boolean("is_current").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("server_is_current_uq")
      .on(t.isCurrent)
      .where(sql`${t.isCurrent}`),
  ],
)

export const endpoint = pgTable(
  "endpoint",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    protocolId: uuid("protocol_id")
      .notNull()
      .references(() => protocol.id, { onDelete: "restrict" }),
    port: integer("port").notNull(),
    config: jsonb("config").notNull(),
    status: endpointStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("endpoint_server_port_uq")
      .on(t.serverId, t.port)
      .where(sql`${t.status} = 'active'`),
    index("endpoint_server_idx").on(t.serverId),
    index("endpoint_protocol_idx").on(t.protocolId),
  ],
)

// ─────────── issued access ───────────

export const accessGrant = pgTable(
  "access_grant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpointId: uuid("endpoint_id")
      .notNull()
      .references(() => endpoint.id, { onDelete: "restrict" }),
    deviceTypeId: uuid("device_type_id")
      .notNull()
      .references(() => deviceType.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    config: jsonb("config").notNull(),
    status: grantStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("access_grant_user_idx").on(t.userId),
    index("access_grant_endpoint_idx").on(t.endpointId),
    index("access_grant_device_type_idx").on(t.deviceTypeId),
  ],
)

// ─────────── relations ───────────

export const protocolTypeRelations = relations(protocolType, ({ many }) => ({
  protocols: many(protocol),
  limits: many(userLimit),
}))

export const protocolRelations = relations(protocol, ({ one, many }) => ({
  type: one(protocolType, {
    fields: [protocol.protocolTypeId],
    references: [protocolType.id],
  }),
  endpoints: many(endpoint),
}))

export const deviceTypeRelations = relations(deviceType, ({ many }) => ({
  grants: many(accessGrant),
}))

export const userLimitRelations = relations(userLimit, ({ one }) => ({
  user: one(user, { fields: [userLimit.userId], references: [user.id] }),
  protocolType: one(protocolType, {
    fields: [userLimit.protocolTypeId],
    references: [protocolType.id],
  }),
}))

export const serverRelations = relations(server, ({ many }) => ({
  endpoints: many(endpoint),
}))

export const endpointRelations = relations(endpoint, ({ one, many }) => ({
  server: one(server, { fields: [endpoint.serverId], references: [server.id] }),
  protocol: one(protocol, { fields: [endpoint.protocolId], references: [protocol.id] }),
  grants: many(accessGrant),
}))

export const accessGrantRelations = relations(accessGrant, ({ one }) => ({
  user: one(user, { fields: [accessGrant.userId], references: [user.id] }),
  endpoint: one(endpoint, { fields: [accessGrant.endpointId], references: [endpoint.id] }),
  deviceType: one(deviceType, {
    fields: [accessGrant.deviceTypeId],
    references: [deviceType.id],
  }),
}))
