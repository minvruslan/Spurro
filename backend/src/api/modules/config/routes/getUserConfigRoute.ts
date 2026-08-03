import { authorized } from "@/api/orpc/index.js"
import { getUserConfigService } from "../services/getUserConfigService.js"

const getUserConfigRoute = authorized.configs.getUserConfig.handler(
  async ({ input, context, errors }) => {
    const result = await getUserConfigService(context.userId, input.id)
    if (!result.ok) {
      switch (result.errorCode) {
        case "not_found":
          throw errors.NOT_FOUND({ cause: result.error })
        /* v8 ignore next 2 */
        default:
          return result.errorCode satisfies never
      }
    }
    return result.data.config
  },
)

export { getUserConfigRoute }
