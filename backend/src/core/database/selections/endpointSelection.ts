import { endpoint, protocol, server } from "../schemas/domainSchema.js"

export const endpointSelection = {
  id: endpoint.id,
  port: endpoint.port,
  status: endpoint.status,
  protocolId: protocol.id,
  protocolCode: protocol.code,
  protocolFamily: protocol.family,
  protocolName: protocol.name,
  serverId: server.id,
  serverName: server.name,
  serverIp: server.ip,
  serverCountry: server.country,
}
