import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getEndpointsService } from "../services/getEndpointsService.js"

const getEndpointsRoute = new Hono<{ Variables: AppVariables }>()

getEndpointsRoute.get("/", async (c) => {
  try {
    const data = await getEndpointsService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getEndpointsRoute }
