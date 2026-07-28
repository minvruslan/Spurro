import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { UpsertUserSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { createUserService } from "../services/createUserService.js"

const createUserRoute = new Hono<{ Variables: AppVariables }>()

createUserRoute.post("/", requestValidator("json", UpsertUserSchema), async (c) => {
  const result = await createUserService(c.req.valid("json"))
  if (!result.ok) {
    switch (result.errorCode) {
      case "email_taken":
        userLogger.warn({ errorCode: result.errorCode, error: result.error }, "Create user failed.")
        return c.json({ error: "User with this email already exists" }, 409)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: result.data.user }, 201)
})

export { createUserRoute }
