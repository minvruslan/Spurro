import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bootstrapDeviceTypes } from "@/core/bootstraps/bootstrapDeviceTypes.js"
import { decryptString } from "@/core/crypto/index.js"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/index.js"
import {
  insertTestConfig,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
} from "@tests/helpers/index.js"

describe("encryptedJsonb", () => {
  it("stores the endpoint data column encrypted at rest", async () => {
    const endpointServer = await insertTestServer()
    const endpointProtocol = await insertTestProtocol()

    const insertedEndpoint = await insertTestEndpoint({
      serverId: endpointServer.id,
      protocolId: endpointProtocol.id,
    })

    const rawEndpointRows = await db.execute<{ data: string }>(
      sql`select data::text as data from endpoint where id = ${insertedEndpoint.id}::uuid`,
    )
    expect(rawEndpointRows).toHaveLength(1)
    const rawData = rawEndpointRows[0].data
    expect(rawData.startsWith("v1:")).toBe(true)
    expect(JSON.parse(decryptString(rawData))).toEqual(insertedEndpoint.data)
  })

  it("stores the server data column encrypted at rest", async () => {
    const insertedServer = await insertTestServer()

    const rawServerRows = await db.execute<{ data: string }>(
      sql`select data::text as data from server where id = ${insertedServer.id}::uuid`,
    )
    expect(rawServerRows).toHaveLength(1)
    const rawData = rawServerRows[0].data
    expect(rawData.startsWith("v1:")).toBe(true)
    expect(JSON.parse(decryptString(rawData))).toEqual(insertedServer.data)
  })

  it("stores the config data column encrypted at rest", async () => {
    await bootstrapDeviceTypes()
    const [configDeviceType] = await db.select().from(deviceType).limit(1)
    const configUser = await insertTestUser()
    const configServer = await insertTestServer()
    const configProtocol = await insertTestProtocol()
    const configEndpoint = await insertTestEndpoint({
      serverId: configServer.id,
      protocolId: configProtocol.id,
    })

    const insertedConfig = await insertTestConfig({
      userId: configUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })

    const rawConfigRows = await db.execute<{ data: string }>(
      sql`select data::text as data from config where id = ${insertedConfig.id}::uuid`,
    )
    expect(rawConfigRows).toHaveLength(1)
    const rawData = rawConfigRows[0].data
    expect(rawData.startsWith("v1:")).toBe(true)
    expect(JSON.parse(decryptString(rawData))).toEqual(insertedConfig.data)
  })
})
