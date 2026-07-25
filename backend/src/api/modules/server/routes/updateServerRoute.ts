import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import { UpsertServerSchema } from "@spurro/shared"
import type { AppVariables } from "@/core/types/index.js"
import { serverLogger } from "@/core/logger/index.js"
import { updateServerService } from "../services/updateServerService.js"

const updateServerRoute = new Hono<{ Variables: AppVariables }>()

updateServerRoute.put(
  "/:id",
  requestValidator("param", z.object({ id: z.uuid() })),
  requestValidator("json", UpsertServerSchema),
  async (c) => {
    const result = await updateServerService(c.req.valid("param").id, c.req.valid("json"))
    if (!result.ok) {
      switch (result.reason) {
        case "not_found":
          serverLogger.warn({ reason: result.reason, error: result.error }, "Update server failed.")
          return c.json({ error: "Server not found" }, 404)
        default:
          return result.reason satisfies never
      }
    }
    return c.json({ data: result.data.server })
  },
)

export { updateServerRoute }
