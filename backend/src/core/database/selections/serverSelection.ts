import { endpoint, protocol, server } from "../schemas/domainSchema.js"

export const serverSelection = {
  id: server.id,
  name: server.name,
  domainName: server.domainName,
  ip: server.ip,
  country: server.country,
  status: server.status,
  isCurrent: server.isCurrent,
  createdAt: server.createdAt,
  updatedAt: server.updatedAt,
  endpointId: endpoint.id,
  endpointPort: endpoint.port,
  endpointStatus: endpoint.status,
  protocolId: protocol.id,
  protocolCode: protocol.code,
  protocolFamily: protocol.family,
  protocolName: protocol.name,
}
