import { authorized } from "@/api/orpc/index.js"
import { deleteUserService } from "../services/deleteUserService.js"

const deleteUserRoute = authorized.users.deleteUser.handler(async ({ input, errors }) => {
  const result = await deleteUserService(input.id)
  if (!result.ok) {
    switch (result.errorCode) {
      case "config_delete_failed":
        throw errors.CONFIG_DELETE_FAILED({ cause: result.error })
      case "configs_appeared":
        throw errors.CONFIGS_APPEARED({ cause: result.error })
      case "not_found":
        throw errors.NOT_FOUND({ cause: result.error })
      /* v8 ignore next 2 */
      default:
        return result.errorCode satisfies never
    }
  }
  return { id: input.id }
})

export { deleteUserRoute }
