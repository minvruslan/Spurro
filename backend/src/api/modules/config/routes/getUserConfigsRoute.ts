import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUserConfigsService } from "../services/getUserConfigsService.js"

const getUserConfigsRoute = new Hono<{ Variables: AppVariables }>()

getUserConfigsRoute.get("/", async (c) => {
  const result = await getUserConfigsService(c.get("userId"))
  return c.json({ data: result.data.configs })
})

export { getUserConfigsRoute }
