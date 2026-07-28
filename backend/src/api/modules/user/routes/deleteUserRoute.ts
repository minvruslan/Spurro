import { Hono } from "hono"
import type { AppVariables } from "@/core/types/index.js"
import { userLogger } from "@/core/logger/index.js"
import { deleteUserService } from "../services/deleteUserService.js"

const deleteUserRoute = new Hono<{ Variables: AppVariables }>()

deleteUserRoute.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const result = await deleteUserService(id)
  if (!result.ok) {
    switch (result.errorCode) {
      case "config_delete_failed":
        userLogger.error(
          { errorCode: result.errorCode, error: result.error },
          "Delete user failed.",
        )
        return c.json(
          {
            error:
              "Failed to delete user's VPN configs: some servers are unreachable — fix or delete those servers, then retry",
          },
          502,
        )
      case "configs_appeared":
        userLogger.warn({ errorCode: result.errorCode, error: result.error }, "Delete user failed.")
        return c.json({ error: "User received new configs during deletion — retry" }, 409)
      case "not_found":
        userLogger.warn({ errorCode: result.errorCode, error: result.error }, "Delete user failed.")
        return c.json({ error: "User not found" }, 404)
      default:
        return result.errorCode satisfies never
    }
  }
  return c.json({ data: { id } })
})

export { deleteUserRoute }
