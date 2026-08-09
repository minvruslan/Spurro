import { authorized } from "@/api/orpc/index.js"
import { deleteUserConfigsService } from "../services/deleteUserConfigsService.js"

const deleteUserConfigRoute = authorized.configs.deleteUserConfig.handler(
  async ({ input, context, errors }) => {
    const result = await deleteUserConfigsService(context.userId, [input.id])
    if (!result.ok) {
      switch (result.errorCode) {
        case "not_found":
          throw errors.NOT_FOUND({ cause: result.error })
        /* v8 ignore next 2 */
        default:
          return result.errorCode satisfies never
      }
    }
    return { id: input.id }
  },
)

export { deleteUserConfigRoute }
