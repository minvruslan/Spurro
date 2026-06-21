import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertServerSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { createServerService } from "../services/createServerService.js"

const createServerRoute = new Hono<{ Variables: AppVariables }>()

createServerRoute.post("/", zValidator("json", UpsertServerSchema), async (c) => {
  try {
    const data = await createServerService(c.req.valid("json"))
    return c.json({ data }, 201)
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { createServerRoute }
