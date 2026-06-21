import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertUserSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { createUserService } from "../services/createUserService.js"

const createUserRoute = new Hono<{ Variables: AppVariables }>()

createUserRoute.post("/", zValidator("json", UpsertUserSchema), async (c) => {
  try {
    const data = await createUserService(c.req.valid("json"))
    return c.json({ data }, 201)
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { createUserRoute }
