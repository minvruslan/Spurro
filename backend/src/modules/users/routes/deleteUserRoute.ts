import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { deleteUserService } from "../services/deleteUserService.js"

const deleteUserRoute = new Hono<{ Variables: AppVariables }>()

deleteUserRoute.delete("/:id", async (c) => {
  try {
    const deleted = await deleteUserService(c.req.param("id"))
    if (!deleted) return c.json({ error: "User not found" }, 404)
    return c.json({ data: { id: c.req.param("id") } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteUserRoute }
