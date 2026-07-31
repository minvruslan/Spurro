import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigLimitsService } from "../services/getUserConfigLimitsService.js"

const getUserConfigLimitsRoute = new Hono<{ Variables: AppVariables }>()

getUserConfigLimitsRoute.get("/", async (c) => {
  const result = await getUserConfigLimitsService(c.get("userId"))
  return c.json({ data: result.data.configLimits })
})

export { getUserConfigLimitsRoute }
