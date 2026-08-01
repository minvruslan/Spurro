import { authorized } from "@/api/orpc/index.js"
import { getServerService } from "../services/getServerService.js"

const getServerRoute = authorized.servers.getServer.handler(async ({ input, errors }) => {
  const result = await getServerService(input.id)
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

export { getServerRoute }
