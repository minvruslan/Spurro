import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { deleteUserConfigService } from "@/api/modules/common/config/index.js"
import type { AppVariables } from "@/core/types/index.js"

const deleteUserConfigRoute = new Hono<{ Variables: AppVariables }>()

deleteUserConfigRoute.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const id = c.req.valid("param").id
    const result = await deleteUserConfigService(c.get("userId"), id)
    if (!result.ok && result.reason === "not_found") {
      return c.json({ error: "Config not found" }, 404)
    }
    return c.json({ data: { id } })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { deleteUserConfigRoute }
