import { authorized } from "@/api/orpc/index.js"
import { deleteServerService } from "../services/deleteServerService.js"

const deleteServerRoute = authorized.servers.deleteServer.handler(async ({ input, errors }) => {
  const result = await deleteServerService(input.id)
  if (!result.ok) {
    switch (result.errorCode) {
      case "current":
        throw errors.CURRENT_SERVER({ cause: result.error })
      case "not_found":
        throw errors.NOT_FOUND({ cause: result.error })
      default:
        return result.errorCode satisfies never
    }
  }
  return { id: input.id }
})

export { deleteServerRoute }
