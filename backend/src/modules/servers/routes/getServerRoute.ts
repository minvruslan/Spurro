import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { getServerService } from "../services/getServerService.js"

const getServerRoute = new Hono<{ Variables: AppVariables }>()

getServerRoute.get("/:id", async (c) => {
  try {
    const data = await getServerService(c.req.param("id"))
    if (!data) return c.json({ error: "Server not found" }, 404)
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getServerRoute }
