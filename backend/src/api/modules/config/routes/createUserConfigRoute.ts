import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { UpsertConfigSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { configLogger } from "@/core/logger/index.js"
import { createUserConfigService } from "../services/createUserConfigService.js"

const createUserConfigRoute = new Hono<{ Variables: AppVariables }>()

createUserConfigRoute.post("/", requestValidator("json", UpsertConfigSchema), async (c) => {
  const result = await createUserConfigService(c.get("userId"), c.req.valid("json"))
  if (!result.ok) {
    switch (result.reason) {
      case "failed":
        configLogger.error({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Failed to create VPN config" }, 502)
      case "no_available_ip":
        configLogger.error({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Server is at capacity (no available IP)" }, 503)
      case "unsupported_protocol":
        configLogger.warn({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Unsupported protocol" }, 400)
      case "limit_reached":
        configLogger.warn({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Config limit reached for this protocol family" }, 409)
      case "endpoint_invalid":
        configLogger.warn({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Invalid endpoint" }, 400)
      case "device_type_invalid":
        configLogger.warn({ reason: result.reason, error: result.error }, "Create config failed.")
        return c.json({ error: "Invalid device type" }, 400)
      default:
        return result.reason satisfies never
    }
  }
  return c.json({ data: result.data.config }, 201)
})

export { createUserConfigRoute }
