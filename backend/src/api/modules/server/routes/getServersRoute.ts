import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getServersService } from "../services/getServersService.js"

const getServersRoute = new Hono<{ Variables: AppVariables }>()

getServersRoute.get("/", async (c) => {
  const result = await getServersService()
  return c.json({ data: result.data.servers })
})

export { getServersRoute }
