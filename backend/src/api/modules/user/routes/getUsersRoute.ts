import { authorized } from "@/api/orpc/index.js"
import { getUsersService } from "../services/getUsersService.js"

const getUsersRoute = authorized.users.getUsers.handler(async () => {
  const result = await getUsersService()
  return result.data.users
})

export { getUsersRoute }
