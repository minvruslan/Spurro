import { randomUUID } from "node:crypto"
import { call, ORPCError } from "@orpc/server"
import { ConfigSchema, type UpsertConfig } from "@spurro/api-contract"
import type { ProtocolClient } from "@spurro/infrastructure"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { configRouter } from "@/api/modules/config/index.js"
import { findDeletableUserConfigs } from "@/api/modules/config/queries/findDeletableUserConfigs.js"
import { getEndpointProtocolClientService } from "@/api/modules/config/services/getEndpointProtocolClientService.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import {
  config,
  configLimit,
  deviceType,
  endpoint,
  protocol,
  server,
} from "@/core/database/schemas/index.js"
import {
  insertTestConfig,
  insertTestConfigLimit,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
  insertTestUser,
  signInTestUser,
} from "../../../helpers/index.js"

vi.mock("@/api/modules/config/services/getEndpointProtocolClientService.js", () => ({
  getEndpointProtocolClientService: vi.fn(),
}))

vi.mock("@/api/modules/config/queries/findDeletableUserConfigs.js", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/api/modules/config/queries/findDeletableUserConfigs.js")
    >()
  return { findDeletableUserConfigs: vi.fn(original.findDeletableUserConfigs) }
})

const allocatedClientIp = "10.8.1.2"

const DeleteUserConfigOutputSchema = z.object({ id: z.uuid() })

function createFakeProtocolClient() {
  return {
    allocateClientIdentifier: vi.fn().mockReturnValue(allocatedClientIp),
    createInitialConfigData: vi.fn().mockImplementation((clientIdentifier: string) => ({
      protocolCode: "amneziawg2" as const,
      ip: clientIdentifier,
    })),
    createAccess: vi.fn().mockResolvedValue({
      configData: {
        protocolCode: "amneziawg2" as const,
        ip: allocatedClientIp,
        publicKey: "fake-public-key",
        presharedKey: "fake-preshared-key",
      },
      clientConfiguration: "fake-client-configuration",
    }),
    deleteAccessByClientIdentifier: vi.fn().mockResolvedValue(undefined),
    deleteAccesses: vi.fn().mockResolvedValue(undefined),
  }
}

let fakeProtocolClient: ReturnType<typeof createFakeProtocolClient>

const deleteUserConfig = (headers: Headers, id: string) =>
  call(configRouter.deleteUserConfig, { id }, { context: { headers } })

const expectDeleteUserConfigError = async (headers: Headers, id: string, errorCode: string) => {
  await expect(deleteUserConfig(headers, id)).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === errorCode,
  )
}

async function insertConfigInfrastructure() {
  const configProtocol = await insertTestProtocol()
  const configServer = await insertTestServer()
  const configEndpoint = await insertTestEndpoint({
    serverId: configServer.id,
    protocolId: configProtocol.id,
  })
  const [configDeviceType] = await db.select().from(deviceType).limit(1)
  return { configEndpoint, configDeviceType }
}

describe("DELETE /configs/{id}", () => {
  beforeEach(async () => {
    fakeProtocolClient = createFakeProtocolClient()
    vi.mocked(getEndpointProtocolClientService).mockReset()
    vi.mocked(getEndpointProtocolClientService).mockImplementation(async () => ({
      ok: true,
      data: {
        client: fakeProtocolClient as unknown as ProtocolClient,
        server: {
          ip: "192.0.2.10",
          domainName: null,
          actualState: {
            ssh: { type: "privateKey", username: "spurro", port: 22 },
            dns: "1.1.1.1",
            appliedAt: new Date().toISOString(),
          },
        },
        endpointActualState: {
          protocolCode: "amneziawg2",
          port: 51820,
          appliedAt: new Date().toISOString(),
        },
        protocolCode: "amneziawg2",
      },
    }))
    await db.delete(config)
    await db.delete(configLimit)
    await db.delete(endpoint)
    await db.delete(server)
    await db.delete(protocol)
    await db.delete(deviceType)
    await bootstrapDeviceTypes()
  })

  it("deletes an active config and returns its id matching the contract output", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const deletedConfig = await deleteUserConfig(headers, insertedConfig.id)

    const parsed = DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(parsed.id).toBe(insertedConfig.id)
  })

  it("exposes exactly the contract fields and nothing more", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const deletedConfig = await deleteUserConfig(headers, insertedConfig.id)

    DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(Object.keys(deletedConfig)).toEqual(["id"])
  })

  it("marks the config deleted in the database", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    await deleteUserConfig(headers, insertedConfig.id)

    const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
    expect(configRows).toHaveLength(1)
    expect(configRows[0].status).toBe("deleted")
  })

  it("removes the peer from the node", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    await deleteUserConfig(headers, insertedConfig.id)

    expect(vi.mocked(getEndpointProtocolClientService)).toHaveBeenCalledWith(configEndpoint.id)
    expect(fakeProtocolClient.deleteAccesses).toHaveBeenCalledWith(expect.anything(), [
      insertedConfig.data,
    ])
  })

  it("frees the user's limit slot immediately after a successful delete", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    await insertTestConfigLimit({ userId: requestUser.id, maxCount: 1 })
    const insertedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    await deleteUserConfig(headers, insertedConfig.id)

    const createUserConfigInput: UpsertConfig = {
      name: "Created Config",
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
    }
    const createdConfig = await call(configRouter.createUserConfig, createUserConfigInput, {
      context: { headers },
    })

    const parsed = ConfigSchema.parse(createdConfig)
    expect(parsed.name).toBe("Created Config")
  })

  it("deletes a pending config cancelling the in-flight creation", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const pendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })

    const deletedConfig = await deleteUserConfig(headers, pendingConfig.id)

    const parsed = DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(parsed.id).toBe(pendingConfig.id)
    const configRows = await db.select().from(config).where(eq(config.id, pendingConfig.id))
    expect(configRows[0].status).toBe("deleted")
  })

  it("deletes a pending config older than the reservation window", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const stalePendingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "pending",
    })
    await db
      .update(config)
      .set({ createdAt: new Date(Date.now() - 7 * 60 * 1000) })
      .where(eq(config.id, stalePendingConfig.id))

    const deletedConfig = await deleteUserConfig(headers, stalePendingConfig.id)

    const parsed = DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(parsed.id).toBe(stalePendingConfig.id)
    const configRows = await db.select().from(config).where(eq(config.id, stalePendingConfig.id))
    expect(configRows[0].status).toBe("deleted")
  })

  it("deletes a config stuck in deleting status", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletingConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleting",
    })

    const deletedConfig = await deleteUserConfig(headers, deletingConfig.id)

    const parsed = DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(parsed.id).toBe(deletingConfig.id)
    const configRows = await db.select().from(config).where(eq(config.id, deletingConfig.id))
    expect(configRows[0].status).toBe("deleted")
  })

  it("rejects a deleted config with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const deletedConfig = await insertTestConfig({
      userId: requestUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "deleted",
    })

    await expectDeleteUserConfigError(headers, deletedConfig.id, "NOT_FOUND")
  })

  it("rejects an unknown id with NOT_FOUND", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectDeleteUserConfigError(headers, randomUUID(), "NOT_FOUND")
  })

  it("rejects another user's config with NOT_FOUND", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)
    const otherUser = await insertTestUser()
    const otherUserConfig = await insertTestConfig({
      userId: otherUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    await expectDeleteUserConfigError(headers, otherUserConfig.id, "NOT_FOUND")
  })

  it("rejects a non-uuid id with BAD_REQUEST", async () => {
    const requestUser = await insertTestUser()
    const headers = await signInTestUser(requestUser)

    await expectDeleteUserConfigError(headers, "not-a-uuid", "BAD_REQUEST")
  })

  describe("node-side delete failure", () => {
    it("returns DELETE_FAILED when the node-side delete fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      const insertedConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })
      fakeProtocolClient.deleteAccesses.mockRejectedValueOnce(new Error("Node-side failure"))

      await expectDeleteUserConfigError(headers, insertedConfig.id, "DELETE_FAILED")
    })

    it("keeps the config in deleting status when the node-side delete fails", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      const insertedConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })
      fakeProtocolClient.deleteAccesses.mockRejectedValueOnce(new Error("Node-side failure"))

      await deleteUserConfig(headers, insertedConfig.id).catch(() => undefined)

      const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
      expect(configRows[0].status).toBe("deleting")
    })

    it("returns DELETE_FAILED and keeps the config deleting when the endpoint protocol client cannot be resolved", async () => {
      const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
      const requestUser = await insertTestUser()
      const headers = await signInTestUser(requestUser)
      const insertedConfig = await insertTestConfig({
        userId: requestUser.id,
        endpointId: configEndpoint.id,
        deviceTypeId: configDeviceType.id,
        status: "active",
      })
      vi.mocked(getEndpointProtocolClientService).mockResolvedValueOnce({
        ok: false,
        errorCode: "unavailable",
        error: new Error("Protocol client unavailable"),
      })

      await expectDeleteUserConfigError(headers, insertedConfig.id, "DELETE_FAILED")

      const configRows = await db.select().from(config).where(eq(config.id, insertedConfig.id))
      expect(configRows[0].status).toBe("deleting")
    })
  })

  it("allows an admin user as well", async () => {
    const { configEndpoint, configDeviceType } = await insertConfigInfrastructure()
    const adminUser = await insertTestUser({ role: "admin" })
    const headers = await signInTestUser(adminUser)
    const adminConfig = await insertTestConfig({
      userId: adminUser.id,
      endpointId: configEndpoint.id,
      deviceTypeId: configDeviceType.id,
      status: "active",
    })

    const deletedConfig = await deleteUserConfig(headers, adminConfig.id)

    const parsed = DeleteUserConfigOutputSchema.parse(deletedConfig)
    expect(parsed.id).toBe(adminConfig.id)
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expectDeleteUserConfigError(new Headers(), randomUUID(), "UNAUTHORIZED")
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the config query throws", async () => {
      vi.mocked(findDeletableUserConfigs).mockRejectedValueOnce(new Error("Query failure"))

      const requestUser = await insertTestUser()
      const response = await app.request(`/api/configs/${randomUUID()}`, {
        method: "DELETE",
        headers: await signInTestUser(requestUser),
      })
      expect(response.status).toBe(500)
    })
  })
})
