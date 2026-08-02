import { call, ORPCError } from "@orpc/server"
import { DeviceTypeSchema, type DeviceType } from "@spurro/api-contract"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { findActiveDeviceTypes } from "@/api/modules/device-type/queries/findActiveDeviceTypes.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/index.js"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/index.js"
import { signInTestUser, insertTestUser } from "../../../helpers/index.js"

vi.mock("@/api/modules/device-type/queries/findActiveDeviceTypes.js", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/api/modules/device-type/queries/findActiveDeviceTypes.js")
    >()
  return { findActiveDeviceTypes: vi.fn(original.findActiveDeviceTypes) }
})

const getDeviceTypes = (headers: Headers) =>
  call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers } })

async function authorizedHeaders(role?: string) {
  const requestUser = await insertTestUser(role ? { role } : {})
  return signInTestUser(requestUser)
}

describe("GET /device-types", () => {
  beforeEach(async () => {
    await db.delete(deviceType)
  })

  it("returns the seeded device-type catalog matching the contract schema", async () => {
    await bootstrapDeviceTypes()
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    const parsed = z.array(DeviceTypeSchema).parse(deviceTypes)
    expect(parsed).toHaveLength(5)
    expect(parsed.map((entry) => entry.code).sort()).toEqual([
      "android",
      "ios",
      "linux",
      "macos",
      "windows",
    ])
  })

  it("exposes exactly the contract fields and nothing more", async () => {
    await bootstrapDeviceTypes()
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    for (const entry of deviceTypes) {
      expect(Object.keys(entry).sort()).toEqual(["code", "id", "name"])
    }
  })

  it("returns each device type with the name matching its code", async () => {
    const expectedNamesByCode: Record<DeviceType["code"], DeviceType["name"]> = {
      ios: "iOS",
      macos: "macOS",
      windows: "Windows",
      linux: "Linux",
      android: "Android",
    }
    await bootstrapDeviceTypes()
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    expect(deviceTypes).toHaveLength(5)
    for (const entry of deviceTypes) {
      expect(entry.name).toBe(expectedNamesByCode[entry.code])
    }
  })

  it("returns entries ordered by name ascending", async () => {
    await bootstrapDeviceTypes()
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    const names = deviceTypes.map((entry) => entry.name)
    expect(names).toEqual([...names].sort())
  })

  it("omits disabled device types", async () => {
    await bootstrapDeviceTypes()
    await db.update(deviceType).set({ isEnabled: false }).where(eq(deviceType.code, "linux"))
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    const codes = deviceTypes.map((entry) => entry.code)
    expect(codes).not.toContain("linux")
    expect(codes).toHaveLength(4)
  })

  it("returns an empty array when all device types are disabled", async () => {
    await bootstrapDeviceTypes()
    await db.update(deviceType).set({ isEnabled: false })
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    expect(deviceTypes).toEqual([])
  })

  it("returns an empty array when no device types exist", async () => {
    const deviceTypes = await getDeviceTypes(await authorizedHeaders())

    expect(deviceTypes).toEqual([])
  })

  it("allows an admin user as well", async () => {
    await bootstrapDeviceTypes()
    const deviceTypes = await getDeviceTypes(await authorizedHeaders("admin"))

    expect(deviceTypes).toHaveLength(5)
  })

  it("rejects an anonymous request with UNAUTHORIZED", async () => {
    await expect(getDeviceTypes(new Headers())).rejects.toSatisfy(
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    )
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the device-type query throws", async () => {
      vi.mocked(findActiveDeviceTypes).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/device-types", {
        headers: await authorizedHeaders(),
      })
      expect(response.status).toBe(500)
    })
  })
})
