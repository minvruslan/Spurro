import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserService } from "../services/getUserService.js"

const getUserRoute = new Hono<{ Variables: AppVariables }>()

getUserRoute.get("/:id", async (c) => {
  try {
    const data = await getUserService(c.req.param("id"))
    if (!data) return c.json({ error: "User not found" }, 404)
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getUserRoute }
