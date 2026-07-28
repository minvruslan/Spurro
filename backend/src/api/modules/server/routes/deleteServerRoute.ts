import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { serverLogger } from "@/core/logger/index.js"
import { deleteServerService } from "../services/deleteServerService.js"

const deleteServerRoute = new Hono<{ Variables: AppVariables }>()

deleteServerRoute.delete(
  "/:id",
  requestValidator("param", z.object({ id: z.uuid() })),
  async (c) => {
    const id = c.req.valid("param").id
    const result = await deleteServerService(id)
    if (!result.ok) {
      switch (result.errorCode) {
        case "current":
          serverLogger.warn(
            { errorCode: result.errorCode, error: result.error },
            "Delete server failed.",
          )
          return c.json({ error: "Cannot delete current server" }, 409)
        case "not_found":
          serverLogger.warn(
            { errorCode: result.errorCode, error: result.error },
            "Delete server failed.",
          )
          return c.json({ error: "Server not found" }, 404)
        default:
          return result.errorCode satisfies never
      }
    }
    return c.json({ data: { id } })
  },
)

export { deleteServerRoute }
