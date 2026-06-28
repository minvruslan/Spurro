import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { UpdateConfigSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { updateConfigService } from "../services/updateConfigService.js"

const updateConfigRoute = new Hono<{ Variables: AppVariables }>()

updateConfigRoute.put(
  "/:id",
  zValidator("param", z.object({ id: z.uuid() })),
  zValidator("json", UpdateConfigSchema),
  async (c) => {
    try {
      const result = await updateConfigService(
        c.get("userId"),
        c.req.valid("param").id,
        c.req.valid("json"),
      )
      if (!result.ok) {
        if (result.reason === "device_type_invalid") {
          return c.json({ error: "Invalid device type" }, 400)
        }
        return c.json({ error: "Config not found" }, 404)
      }
      return c.json({ data: result.data })
    } catch {
      return c.json({ error: "Internal server error" }, 500)
    }
  },
)

export { updateConfigRoute }
