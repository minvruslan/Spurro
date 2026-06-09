import { db } from "@/core/database/index.js"
import { deviceType } from "@/core/database/schema.js"

const DEVICE_TYPES = [
  { code: "ios", name: "iOS" },
  { code: "macos", name: "macOS" },
  { code: "windows", name: "Windows" },
  { code: "linux", name: "Linux" },
  { code: "android", name: "Android" },
]

export async function bootstrapDeviceTypes() {
  const inserted = await db
    .insert(deviceType)
    .values(DEVICE_TYPES)
    .onConflictDoNothing({ target: deviceType.code })
    .returning({ code: deviceType.code })

  if (inserted.length > 0) {
    console.log(`[bootstrap] seeded device types: ${inserted.map((r) => r.code).join(", ")}`)
  }
}
