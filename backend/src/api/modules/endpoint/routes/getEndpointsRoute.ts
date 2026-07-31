import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getEndpointsService } from "../services/getEndpointsService.js"

const getEndpointsRoute = new Hono<{ Variables: AppVariables }>()

getEndpointsRoute.get("/", async (c) => {
  const result = await getEndpointsService()
  return c.json({ data: result.data.endpoints })
})

export { getEndpointsRoute }
