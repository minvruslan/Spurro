import { authorized } from "@/api/orpc/index.js"
import { getServersService } from "../services/getServersService.js"

const getServersRoute = authorized.servers.getServers.handler(async () => {
  const result = await getServersService()
  return result.data.servers
})

export { getServersRoute }
