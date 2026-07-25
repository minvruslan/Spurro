import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { UpsertUserSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { updateUserService } from "../services/updateUserService.js"

const updateUserRoute = new Hono<{ Variables: AppVariables }>()

updateUserRoute.put("/:id", requestValidator("json", UpsertUserSchema), async (c) => {
  const result = await updateUserService(c.req.param("id"), c.req.valid("json"))
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        userLogger.warn({ reason: result.reason, error: result.error }, "Update user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.reason satisfies never
    }
  }
  return c.json({ data: result.data.user })
})

export { updateUserRoute }
