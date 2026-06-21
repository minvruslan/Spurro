import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertServerSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { updateServerService } from "../services/updateServerService.js"

const updateServerRoute = new Hono<{ Variables: AppVariables }>()

updateServerRoute.put("/:id", zValidator("json", UpsertServerSchema), async (c) => {
  try {
    const data = await updateServerService(c.req.param("id"), c.req.valid("json"))
    if (!data) return c.json({ error: "Server not found" }, 404)
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { updateServerRoute }
