import { authorized } from "@/api/orpc/index.js"
import { getUserService } from "../services/getUserService.js"

const getUserRoute = authorized.users.getUser.handler(async ({ input, errors }) => {
  const result = await getUserService(input.id)
  if (!result.ok) {
    switch (result.errorCode) {
      case "not_found":
        throw errors.NOT_FOUND({ cause: result.error })
      /* v8 ignore next 2 */
      default:
        return result.errorCode satisfies never
    }
  }
  return result.data.user
})

export { getUserRoute }
