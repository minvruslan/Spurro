import { Hono } from "hono"
import { requestValidator } from "@/core/validation/index.js"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { serverLogger } from "@/core/logger/index.js"
import { getServerService } from "../services/getServerService.js"

const getServerRoute = new Hono<{ Variables: AppVariables }>()

getServerRoute.get("/:id", requestValidator("param", z.object({ id: z.uuid() })), async (c) => {
  const result = await getServerService(c.req.valid("param").id)
  if (!result.ok) {
    switch (result.errorCode) {
      case "not_found":
        serverLogger.warn(
          { errorCode: result.errorCode, error: result.error },
          "Get server failed.",
        )
        return c.json({ error: "Server not found" }, 404)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: result.data.server })
})

export { getServerRoute }
