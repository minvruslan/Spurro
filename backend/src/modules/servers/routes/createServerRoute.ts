import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { UpsertServerSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { createServerService } from "../services/createServerService.js"
import { formatDatabaseError } from "../utils/formatDatabaseError.js"

const createServerRoute = new Hono<{ Variables: AppVariables }>()

createServerRoute.post("/", zValidator("json", UpsertServerSchema), async (c) => {
  try {
    const data = await createServerService(c.req.valid("json"))
    return c.json({ data }, 201)
  } catch (error) {
    const formattedError = formatDatabaseError(error)
    if (formattedError) return c.json({ error: formattedError.message }, formattedError.status)
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { createServerRoute }
