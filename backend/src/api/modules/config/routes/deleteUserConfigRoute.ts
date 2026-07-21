import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { deleteUserConfigsService } from "../services/deleteUserConfigsService.js"
import type { AppVariables } from "@/core/types/index.js"

const deleteUserConfigRoute = new Hono<{ Variables: AppVariables }>()

deleteUserConfigRoute.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const id = c.req.valid("param").id
    const result = await deleteUserConfigsService(c.get("userId"), [id])
    if (!result.ok) {
      return c.json({ error: "Failed to delete config" }, 502)
    }
    if (result.deletedConfigIds.length === 0) {
      return c.json({ error: "Config not found" }, 404)
    }
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteUserConfigRoute }
