import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigsService } from "../services/getConfigsService.js"

const getConfigsRoute = new Hono<{ Variables: AppVariables }>()

getConfigsRoute.get("/", async (c) => {
  try {
    const data = await getConfigsService(c.get("userId"))
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getConfigsRoute }
