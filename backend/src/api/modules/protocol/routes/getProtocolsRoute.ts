import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolsService } from "../services/getProtocolsService.js"

const getProtocolsRoute = new Hono<{ Variables: AppVariables }>()

getProtocolsRoute.get("/", async (c) => {
  try {
    const data = await getProtocolsService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getProtocolsRoute }
