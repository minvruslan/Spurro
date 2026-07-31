import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUsersService } from "../services/getUsersService.js"

const getUsersRoute = new Hono<{ Variables: AppVariables }>()

getUsersRoute.get("/", async (c) => {
  const result = await getUsersService()
  return c.json({ data: result.data.users })
})

export { getUsersRoute }
