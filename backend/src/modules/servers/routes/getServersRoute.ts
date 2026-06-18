import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getServersService } from "../services/getServersService.js"

const getServersRoute = new Hono<{ Variables: AppVariables }>()

getServersRoute.get("/", async (c) => {
  try {
    const data = await getServersService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getServersRoute }
