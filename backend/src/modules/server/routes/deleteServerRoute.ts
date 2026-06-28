import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { deleteServerService } from "../services/deleteServerService.js"

const deleteServerRoute = new Hono<{ Variables: AppVariables }>()

deleteServerRoute.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const id = c.req.valid("param").id
    const result = await deleteServerService(id)
    if (!result.ok) {
      if (result.reason === "current") {
        return c.json({ error: "Cannot delete current server" }, 409)
      }
      return c.json({ error: "Server not found" }, 404)
    }
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteServerRoute }
