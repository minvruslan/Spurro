import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigsService } from "../services/getUserConfigsService.js"

const getUserConfigsRoute = new Hono<{ Variables: AppVariables }>()

getUserConfigsRoute.get("/", async (c) => {
  try {
    const data = await getUserConfigsService(c.get("userId"))
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getUserConfigsRoute }
