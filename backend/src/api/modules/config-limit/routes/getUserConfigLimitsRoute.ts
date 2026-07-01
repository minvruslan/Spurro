import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigLimitsService } from "@/api/modules/common/config-limit/index.js"

const getUserConfigLimitsRoute = new Hono<{ Variables: AppVariables }>()

getUserConfigLimitsRoute.get("/", async (c) => {
  try {
    const data = await getUserConfigLimitsService(c.get("userId"))
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getUserConfigLimitsRoute }
