import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { getUserService } from "../services/getUserService.js"

const getUserRoute = new Hono<{ Variables: AppVariables }>()

getUserRoute.get("/:id", async (c) => {
  const result = await getUserService(c.req.param("id"))
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        userLogger.warn({ reason: result.reason, error: result.error }, "Get user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.reason satisfies never
    }
  }
  return c.json({ data: result.data.user })
})

export { getUserRoute }
