import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getProtocolTypesService } from "../services/getProtocolTypesService.js"

const getProtocolTypesRoute = new Hono<{ Variables: AppVariables }>()

getProtocolTypesRoute.get("/", async (c) => {
  try {
    const data = await getProtocolTypesService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getProtocolTypesRoute }
