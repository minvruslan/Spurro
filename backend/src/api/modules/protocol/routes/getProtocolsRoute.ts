import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolsService } from "../services/getProtocolsService.js"

const getProtocolsRoute = new Hono<{ Variables: AppVariables }>()

getProtocolsRoute.get("/", async (c) => {
  const result = await getProtocolsService()
  return c.json({ data: result.data.protocols })
})

export { getProtocolsRoute }
