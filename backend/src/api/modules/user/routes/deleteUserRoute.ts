import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { deleteUserService } from "../services/deleteUserService.js"

const deleteUserRoute = new Hono<{ Variables: AppVariables }>()

deleteUserRoute.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const result = await deleteUserService(id)
  if (!result.ok) {
    switch (result.reason) {
      case "config_delete_failed":
        userLogger.error({ reason: result.reason, error: result.error }, "Delete user failed.")
        return c.json(
          { error: "Failed to delete user's VPN configs: some servers are unreachable — fix or delete those servers, then retry" },
          502,
        )
      case "configs_appeared":
        userLogger.warn({ reason: result.reason, error: result.error }, "Delete user failed.")
        return c.json({ error: "User received new configs during deletion — retry" }, 409)
      case "not_found":
        userLogger.warn({ reason: result.reason, error: result.error }, "Delete user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.reason satisfies never
    }
  }
  return c.json({ data: { id } })
})

export { deleteUserRoute }
