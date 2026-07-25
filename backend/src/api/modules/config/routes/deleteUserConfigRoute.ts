import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { configLogger } from "@/core/logger/index.js"
import { deleteUserConfigsService } from "../services/deleteUserConfigsService.js"

const deleteUserConfigRoute = new Hono<{ Variables: AppVariables }>()

deleteUserConfigRoute.delete(
  "/:id",
  requestValidator("param", z.object({ id: z.uuid() })),
  async (c) => {
    const id = c.req.valid("param").id
    const result = await deleteUserConfigsService(c.get("userId"), [id])
    if (!result.ok) {
      switch (result.reason) {
        case "not_found":
          configLogger.warn({ reason: result.reason, error: result.error }, "Delete config failed.")
          return c.json({ error: "Config not found" }, 404)
        default:
          return result.reason satisfies never
      }
    }

    if (result.data.deleteFailedConfigIds.length > 0) {
      configLogger.error({ configId: id }, "Delete config failed.")
      return c.json({ error: "Failed to delete config" }, 502)
    }

    return c.json({ data: { id } })
  },
)

export { deleteUserConfigRoute }
