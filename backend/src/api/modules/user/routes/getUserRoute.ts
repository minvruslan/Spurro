import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { getUserService } from "../services/getUserService.js"

const getUserRoute = new Hono<{ Variables: AppVariables }>()

getUserRoute.get("/:id", async (c) => {
  const result = await getUserService(c.req.param("id"))
  if (!result.ok) {
    switch (result.errorCode) {
      case "not_found":
        userLogger.warn({ errorCode: result.errorCode, error: result.error }, "Get user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: result.data.user })
})

export { getUserRoute }
