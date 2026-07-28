import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import { UpdateConfigSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { configLogger } from "@/core/logger/index.js"
import { updateUserConfigService } from "../services/updateUserConfigService.js"

const updateUserConfigRoute = new Hono<{ Variables: AppVariables }>()

updateUserConfigRoute.put(
  "/:id",
  requestValidator("param", z.object({ id: z.uuid() })),
  requestValidator("json", UpdateConfigSchema),
  async (c) => {
    const result = await updateUserConfigService(
      c.get("userId"),
      c.req.valid("param").id,
      c.req.valid("json"),
    )
    if (!result.ok) {
      switch (result.errorCode) {
        case "device_type_invalid":
          configLogger.warn(
            { errorCode: result.errorCode, error: result.error },
            "Update config failed.",
          )
          return c.json({ error: "Invalid device type" }, 400)
        case "not_found":
          configLogger.warn(
            { errorCode: result.errorCode, error: result.error },
            "Update config failed.",
          )
          return c.json({ error: "Config not found" }, 404)
        default:
          return result.errorCode satisfies never
      }
    }
    return c.json({ data: result.data.config })
  },
)

export { updateUserConfigRoute }
