import { authorized } from "@/api/orpc/index.js"
import { updateUserService } from "../services/updateUserService.js"

const updateUserRoute = authorized.users.updateUser.handler(async ({ input, errors }) => {
  const { id, ...payload } = input
  const result = await updateUserService(id, payload)
  if (!result.ok) {
    switch (result.errorCode) {
      case "not_found":
        throw errors.NOT_FOUND({ cause: result.error })
      case "email_taken":
        throw errors.EMAIL_TAKEN({ cause: result.error })
      /* v8 ignore next 2 */
      default:
        return result.errorCode satisfies never
    }
  }
  return result.data.user
})

export { updateUserRoute }
