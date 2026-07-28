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
    switch (result.errorCode) {
      case "not_found":
        userLogger.warn({ errorCode: result.errorCode, error: result.error }, "Update user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: result.data.user })
})

export { updateUserRoute }
