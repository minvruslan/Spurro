import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertConfigSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { createConfigService } from "../services/createConfigService.js"

const createConfigRoute = new Hono<{ Variables: AppVariables }>()

createConfigRoute.post("/", zValidator("json", UpsertConfigSchema), async (c) => {
  try {
    const result = await createConfigService(c.get("userId"), c.req.valid("json"))
    if (!result.ok) {
      return c.json({ error: "Invalid endpoint or device type" }, 400)
    }
    return c.json({ data: result.data }, 201)
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { createConfigRoute }
