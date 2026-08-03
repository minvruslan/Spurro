import { beforeEach, describe, expect, it } from "vitest"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/index.js"
import { insertTestConfig } from "./insertTestConfig.js"
import { insertTestEndpoint } from "./insertTestEndpoint.js"
import { insertTestProtocol } from "./insertTestProtocol.js"
import { insertTestServer } from "./insertTestServer.js"
import { insertTestUser } from "./insertTestUser.js"

describe("insertTestConfig", () => {
  beforeEach(bootstrapDeviceTypes)

  it("creates a persisted active config bound to its user, endpoint and device type", async () => {
    const configUser = await insertTestUser()
    const configProtocol = await insertTestProtocol()
    const configServer = await insertTestServer()
    const configEndpoint = await insertTestEndpoint({
      serverId: configServer.id,
      protocolId: configProtocol.id,
    })
    const [configDeviceType] = await db.select().from(deviceType).limit(1)
    const insertedConfig = await insertTestConfig({
      userId: configUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    })

    expect(insertedConfig.userId).toBe(configUser.id)
    expect(insertedConfig.endpointId).toBe(configEndpoint.id)
    expect(insertedConfig.deviceTypeId).toBe(configDeviceType.id)
    expect(insertedConfig.status).toBe("active")
  })
})
