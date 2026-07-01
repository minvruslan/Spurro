import { endpoint, protocol, protocolType, server } from "../schemas/domainSchema.js"

export const endpointSelection = {
  id: endpoint.id,
  port: endpoint.port,
  status: endpoint.status,
  protocolId: protocol.id,
  protocolVersion: protocol.version,
  protocolTypeId: protocolType.id,
  protocolTypeCode: protocolType.code,
  protocolTypeName: protocolType.name,
  serverId: server.id,
  serverName: server.name,
  serverDomainName: server.domainName,
  serverIp: server.ip,
  serverCountry: server.country,
}
