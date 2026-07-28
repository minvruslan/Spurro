import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { UpsertServerSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { serverLogger } from "@/core/logger/index.js"
import { createServerService } from "../services/createServerService.js"

const createServerRoute = new Hono<{ Variables: AppVariables }>()

createServerRoute.post("/", requestValidator("json", UpsertServerSchema), async (c) => {
  const result = await createServerService(c.req.valid("json"))
  if (!result.ok) {
    switch (result.errorCode) {
      case "enqueue_failed":
        serverLogger.error(
          { errorCode: result.errorCode, error: result.error },
          "Create server failed.",
        )
        return c.json({ error: "Failed to enqueue server provisioning" }, 502)
      case "credentials_required":
        serverLogger.warn(
          { errorCode: result.errorCode, error: result.error },
          "Create server failed.",
        )
        return c.json({ error: "Server credentials (username/password) are required" }, 400)
      case "duplicate_protocol":
        serverLogger.warn(
          { errorCode: result.errorCode, error: result.error },
          "Create server failed.",
        )
        return c.json({ error: "Multiple endpoints of the same protocol are not supported" }, 409)
      case "protocol_not_found":
        serverLogger.warn(
          { errorCode: result.errorCode, error: result.error },
          "Create server failed.",
        )
        return c.json({ error: "Protocol not found" }, 400)
      case "unsupported_protocol":
        serverLogger.warn(
          { errorCode: result.errorCode, error: result.error },
          "Create server failed.",
        )
        return c.json({ error: "Unsupported protocol" }, 400)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: result.data.server }, 201)
})

export { createServerRoute }
