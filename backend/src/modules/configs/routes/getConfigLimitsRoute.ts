import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigLimitsService } from "../services/getConfigLimitsService.js"

const getConfigLimitsRoute = new Hono<{ Variables: AppVariables }>()

getConfigLimitsRoute.get("/limits", async (c) => {
  try {
    const data = await getConfigLimitsService(c.get("userId"))
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getConfigLimitsRoute }
