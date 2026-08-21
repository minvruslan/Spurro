import { call } from "@orpc/server"
import { DeviceTypeSchema, type DeviceType } from "@vancloak/api-contract"
import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import app from "@/api/app.js"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { findActiveDeviceTypes } from "@/api/modules/device-type/queries/findActiveDeviceTypes.js"
import { bootstrapDeviceTypes } from "@/core/bootstraps/bootstrapDeviceTypes.js"
import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schemas/index.js"
import { signInTestAdmin, signInTestUser } from "@tests/helpers/index.js"

vi.mock("@/api/modules/device-type/queries/findActiveDeviceTypes.js", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/api/modules/device-type/queries/findActiveDeviceTypes.js")
    >()
  return { findActiveDeviceTypes: vi.fn(original.findActiveDeviceTypes) }
})

function callGetDeviceTypes(headers: Headers) {
  return call(deviceTypeRouter.getDeviceTypes, undefined, { context: { headers } })
}

describe("GET /device-types", () => {
  it("returns the seeded device-type catalog matching the contract schema", async () => {
    const expectedNamesByCode: Record<DeviceType["code"], DeviceType["name"]> = {
      ios: "iOS",
      ipados: "iPadOS",
      macos: "macOS",
      windows: "Windows",
      android: "Android",
    }
    await bootstrapDeviceTypes()

    const deviceTypes = await callGetDeviceTypes(await signInTestUser())

    const parsed = z.array(DeviceTypeSchema).parse(deviceTypes)
    expect(parsed.map((entry) => entry.code).sort()).toEqual(
      [...DeviceTypeSchema.shape.code.options].sort(),
    )
    for (const entry of deviceTypes) {
      expect(Object.keys(entry).sort()).toEqual([...DeviceTypeSchema.keyof().options].sort())
    }
    for (const entry of parsed) {
      expect(entry.name).toBe(expectedNamesByCode[entry.code])
    }
    expect(parsed.map((entry) => entry.name)).toEqual([
      "iOS",
      "iPadOS",
      "macOS",
      "Android",
      "Windows",
    ])
  })

  it("omits disabled device types", async () => {
    await bootstrapDeviceTypes()
    await db
      .update(deviceType)
      .set({ isEnabled: false })
      .where(eq(deviceType.code, DeviceTypeSchema.shape.code.enum.windows))

    const deviceTypes = await callGetDeviceTypes(await signInTestUser())

    const codes = deviceTypes.map((entry) => entry.code)
    expect(codes).not.toContain(DeviceTypeSchema.shape.code.enum.windows)
    expect(codes).toHaveLength(DeviceTypeSchema.shape.code.options.length - 1)
  })

  it("returns an empty array when all device types are disabled", async () => {
    await bootstrapDeviceTypes()
    await db.update(deviceType).set({ isEnabled: false })

    const deviceTypes = await callGetDeviceTypes(await signInTestUser())

    expect(deviceTypes).toEqual([])
  })

  it("returns an empty array when no device types exist", async () => {
    const deviceTypes = await callGetDeviceTypes(await signInTestUser())

    expect(deviceTypes).toEqual([])
  })

  it("allows an admin user as well", async () => {
    await bootstrapDeviceTypes()

    const deviceTypes = await callGetDeviceTypes(await signInTestAdmin())

    expect(deviceTypes).toHaveLength(DeviceTypeSchema.shape.code.options.length)
  })

  describe("technical", () => {
    it("responds with HTTP 500 when the device-type query throws", async () => {
      vi.mocked(findActiveDeviceTypes).mockRejectedValueOnce(new Error("Query failure"))

      const response = await app.request("/api/device-types", {
        headers: await signInTestUser(),
      })
      expect(response.status).toBe(500)
    })
  })
})
