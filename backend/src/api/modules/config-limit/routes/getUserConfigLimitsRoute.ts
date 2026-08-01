import { authorized } from "@/api/orpc/index.js"
import { getUserConfigLimitsService } from "../services/getUserConfigLimitsService.js"

const getUserConfigLimitsRoute = authorized.configLimits.getUserConfigLimits.handler(
  async ({ context }) => {
    const result = await getUserConfigLimitsService(context.userId)
    return result.data.configLimits
  },
)

export { getUserConfigLimitsRoute }
