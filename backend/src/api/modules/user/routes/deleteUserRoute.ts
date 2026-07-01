import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { deleteUserService } from "../services/deleteUserService.js"

const deleteUserRoute = new Hono<{ Variables: AppVariables }>()

deleteUserRoute.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const result = await deleteUserService(id)
    if (!result.ok) {
      return c.json({ error: "User not found" }, 404)
    }
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteUserRoute }
