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
import { user } from "./authSchema"

// Enums

export const serverStatus = pgEnum("server_status", ["provisioning", "active", "failed", "deleted"])
export const endpointStatus = pgEnum("endpoint_status", ["active", "deleted"])
export const configStatus = pgEnum("config_status", ["active", "deleted"])

// Catalog

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

// Limits

export const configLimit = pgTable(
  "config_limit",
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
  (t) => [unique("config_limit_user_type_uq").on(t.userId, t.protocolTypeId)],
)

// Infrastructure

export const server = pgTable(
  "server",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    domainName: text("domain_name").notNull(),
    ip: text("ip").notNull(),
    country: text("country").notNull(),
    status: serverStatus("status").default("active").notNull(),
    // SSH secrets stored in plaintext for now; encrypt or switch to a key later.
    data: jsonb("data").$type<{ ssh: { login: string; password: string } }>(),
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
    data: jsonb("data").notNull(),
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

// Issued access

export const config = pgTable(
  "config",
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
    data: jsonb("data").notNull(),
    status: configStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("config_user_idx").on(t.userId),
    index("config_endpoint_idx").on(t.endpointId),
    index("config_device_type_idx").on(t.deviceTypeId),
  ],
)

// Relations

export const protocolTypeRelations = relations(protocolType, ({ many }) => ({
  protocols: many(protocol),
  configLimits: many(configLimit),
}))

export const protocolRelations = relations(protocol, ({ one, many }) => ({
  type: one(protocolType, {
    fields: [protocol.protocolTypeId],
    references: [protocolType.id],
  }),
  endpoints: many(endpoint),
}))

export const deviceTypeRelations = relations(deviceType, ({ many }) => ({
  configs: many(config),
}))

export const configLimitRelations = relations(configLimit, ({ one }) => ({
  user: one(user, { fields: [configLimit.userId], references: [user.id] }),
  protocolType: one(protocolType, {
    fields: [configLimit.protocolTypeId],
    references: [protocolType.id],
  }),
}))

export const serverRelations = relations(server, ({ many }) => ({
  endpoints: many(endpoint),
}))

export const endpointRelations = relations(endpoint, ({ one, many }) => ({
  server: one(server, { fields: [endpoint.serverId], references: [server.id] }),
  protocol: one(protocol, { fields: [endpoint.protocolId], references: [protocol.id] }),
  configs: many(config),
}))

export const configRelations = relations(config, ({ one }) => ({
  user: one(user, { fields: [config.userId], references: [user.id] }),
  endpoint: one(endpoint, { fields: [config.endpointId], references: [endpoint.id] }),
  deviceType: one(deviceType, {
    fields: [config.deviceTypeId],
    references: [deviceType.id],
  }),
}))
