import { authorized } from "@/api/orpc/index.js"
import { createUserService } from "../services/createUserService.js"

const createUserRoute = authorized.users.createUser.handler(async ({ input, errors }) => {
  const result = await createUserService(input)
  if (!result.ok) {
    switch (result.errorCode) {
      case "email_taken":
        throw errors.EMAIL_TAKEN({ cause: result.error })
      /* v8 ignore next 2 */
      default:
        return result.errorCode satisfies never
    }
  }
  return result.data.user
})

export { createUserRoute }
