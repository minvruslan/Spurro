import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getDeviceTypesService } from "../services/getDeviceTypesService.js"

const getDeviceTypesRoute = new Hono<{ Variables: AppVariables }>()

getDeviceTypesRoute.get("/", async (c) => {
  const result = await getDeviceTypesService()
  return c.json({ data: result.data.deviceTypes })
})

export { getDeviceTypesRoute }
