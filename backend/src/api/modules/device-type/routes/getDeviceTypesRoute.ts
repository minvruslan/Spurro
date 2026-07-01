import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getDeviceTypesService } from "../services/getDeviceTypesService.js"

const getDeviceTypesRoute = new Hono<{ Variables: AppVariables }>()

getDeviceTypesRoute.get("/", async (c) => {
  try {
    const data = await getDeviceTypesService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getDeviceTypesRoute }
