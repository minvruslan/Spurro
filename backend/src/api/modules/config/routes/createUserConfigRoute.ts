import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertConfigSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { createUserConfigService } from "../services/createUserConfigService.js"

const createUserConfigRoute = new Hono<{ Variables: AppVariables }>()

createUserConfigRoute.post("/", zValidator("json", UpsertConfigSchema), async (c) => {
  try {
    const result = await createUserConfigService(c.get("userId"), c.req.valid("json"))
    if (!result.ok) {
      if (result.reason === "failed") {
        return c.json({ error: "Failed to create VPN config" }, 502)
      }
      if (result.reason === "unsupported_protocol") {
        return c.json({ error: "Unsupported protocol" }, 400)
      }
      if (result.reason === "no_available_ip") {
        return c.json({ error: "Server is at capacity (no available IP)" }, 503)
      }
      return c.json({ error: "Invalid endpoint or device type" }, 400)
    }
    return c.json({ data: result.data }, 201)
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { createUserConfigRoute }
