import { authorized } from "@/api/orpc/index.js"
import { getUserConfigsService } from "../services/getUserConfigsService.js"

const getUserConfigsRoute = authorized.configs.getUserConfigs.handler(async ({ context }) => {
  const result = await getUserConfigsService(context.userId)
  return result.data.configs
})

export { getUserConfigsRoute }
