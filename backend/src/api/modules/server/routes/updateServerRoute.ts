import { authorized } from "@/api/orpc/index.js"
import { updateServerService } from "../services/updateServerService.js"

const updateServerRoute = authorized.servers.updateServer.handler(async ({ input, errors }) => {
  const { id, ...payload } = input
  const result = await updateServerService(id, payload)
  if (!result.ok) {
    switch (result.errorCode) {
      case "not_found":
        throw errors.NOT_FOUND({ cause: result.error })
      default:
        return result.errorCode satisfies never
    }
  }
  return result.data.server
})

export { updateServerRoute }
