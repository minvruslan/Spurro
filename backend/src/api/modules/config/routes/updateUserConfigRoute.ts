import { authorized } from "@/api/orpc/index.js"
import { updateUserConfigService } from "../services/updateUserConfigService.js"

const updateUserConfigRoute = authorized.configs.updateUserConfig.handler(
  async ({ input, context, errors }) => {
    const { id, ...payload } = input
    const result = await updateUserConfigService(context.userId, id, payload)
    if (!result.ok) {
      switch (result.errorCode) {
        case "device_type_invalid":
          throw errors.DEVICE_TYPE_INVALID({ cause: result.error })
        case "not_found":
          throw errors.NOT_FOUND({ cause: result.error })
        default:
          return result.errorCode satisfies never
      }
    }
    return result.data.config
  },
)

export { updateUserConfigRoute }
