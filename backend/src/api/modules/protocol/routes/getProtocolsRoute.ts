import { authorized } from "@/api/orpc/index.js"
import { getProtocolsService } from "../services/getProtocolsService.js"

const getProtocolsRoute = authorized.protocols.getProtocols.handler(async () => {
  const result = await getProtocolsService()
  return result.data.protocols
})

export { getProtocolsRoute }
