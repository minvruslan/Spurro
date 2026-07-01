import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getUsersService } from "../services/getUsersService.js"

const getUsersRoute = new Hono<{ Variables: AppVariables }>()

getUsersRoute.get("/", async (c) => {
  try {
    const data = await getUsersService()
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getUsersRoute }
