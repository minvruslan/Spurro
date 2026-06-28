import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { AppVariables } from "@/core/types/index.js"
import { getConfigService } from "../services/getConfigService.js"

const getConfigRoute = new Hono<{ Variables: AppVariables }>()

getConfigRoute.get("/:id", zValidator("param", z.object({ id: z.uuid() })), async (c) => {
  try {
    const data = await getConfigService(c.get("userId"), c.req.valid("param").id)
    if (!data) return c.json({ error: "Config not found" }, 404)
    return c.json({ data })
  } catch {
    return c.json({ error: "Internal server error" }, 500)
  }
})

export { getConfigRoute }
