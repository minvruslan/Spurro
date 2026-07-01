import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { deleteUserConfigService } from "../services/deleteUserConfigService.js"

const deleteUserConfigRoute = new Hono<{ Variables: AppVariables }>()

deleteUserConfigRoute.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const id = c.req.valid("param").id
    const result = await deleteUserConfigService(c.get("userId"), id)
    if (!result.ok) {
      return c.json({ error: "Config not found" }, 404)
    }
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteUserConfigRoute }
