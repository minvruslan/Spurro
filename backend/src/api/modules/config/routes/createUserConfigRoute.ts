import { authorized } from "@/api/orpc/index.js"
import { createUserConfigService } from "../services/createUserConfigService.js"

const createUserConfigRoute = authorized.configs.createUserConfig.handler(
  async ({ input, context, errors }) => {
    const result = await createUserConfigService(context.userId, input)
    if (!result.ok) {
      switch (result.errorCode) {
        case "failed":
          throw errors.FAILED({ cause: result.error })
        case "no_available_ip":
          throw errors.NO_AVAILABLE_IP({ cause: result.error })
        case "unsupported_protocol":
          throw errors.UNSUPPORTED_PROTOCOL({ cause: result.error })
        case "limit_reached":
          throw errors.LIMIT_REACHED({ cause: result.error })
        case "endpoint_invalid":
          throw errors.ENDPOINT_INVALID({ cause: result.error })
        case "device_type_invalid":
          throw errors.DEVICE_TYPE_INVALID({ cause: result.error })
        /* v8 ignore next 2 */
        default:
          return result.errorCode satisfies never
      }
    }
    return result.data.config
  },
)

export { createUserConfigRoute }
