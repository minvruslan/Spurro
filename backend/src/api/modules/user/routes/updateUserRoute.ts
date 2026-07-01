import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertUserSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { updateUserService } from "../services/updateUserService.js"

const updateUserRoute = new Hono<{ Variables: AppVariables }>()

updateUserRoute.put("/:id", zValidator("json", UpsertUserSchema), async (c) => {
  try {
    const data = await updateUserService(c.req.param("id"), c.req.valid("json"))
    if (!data) return c.json({ error: "User not found" }, 404)
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { updateUserRoute }
