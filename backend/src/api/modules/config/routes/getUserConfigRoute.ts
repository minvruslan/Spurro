import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { configLogger } from "@/core/logger/index.js"
import { getUserConfigService } from "../services/getUserConfigService.js"

const getUserConfigRoute = new Hono<{ Variables: AppVariables }>()

getUserConfigRoute.get("/:id", requestValidator("param", z.object({ id: z.uuid() })), async (c) => {
  const result = await getUserConfigService(c.get("userId"), c.req.valid("param").id)
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        configLogger.warn({ reason: result.reason, error: result.error }, "Get config failed.")
        return c.json({ error: "Config not found" }, 404)
      default:
        return result.reason satisfies never
    }
  }
  return c.json({ data: result.data.config })
})

export { getUserConfigRoute }
