import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigLimitsService } from "@/modules/common/config-limit/index.js"

const getConfigLimitsRoute = new Hono<{ Variables: AppVariables }>()

getConfigLimitsRoute.get("/", async (c) => {
  try {
    const data = await getConfigLimitsService(c.get("userId"))
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getConfigLimitsRoute }
