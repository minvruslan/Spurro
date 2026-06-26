import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { deleteConfigService } from "../services/deleteConfigService.js"

const deleteConfigRoute = new Hono<{ Variables: AppVariables }>()

deleteConfigRoute.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const id = c.req.valid("param").id
    const deleted = await deleteConfigService(c.get("userId"), id)
    if (!deleted) return c.json({ error: "Config not found" }, 404)
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteConfigRoute }
