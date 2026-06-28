import type { Endpoint } from "@spurro/shared"
import type { findActiveEndpoints } from "../queries/findActiveEndpoints.js"

type EndpointRow = Awaited<ReturnType<typeof findActiveEndpoints>>[number]

export function createEndpointFromDatabaseData(row: EndpointRow): Endpoint {
  return {
    id: row.id,
    port: row.port,
    protocol: {
      id: row.protocolId,
      version: row.protocolVersion,
      type: {
        id: row.protocolTypeId,
        code: row.protocolTypeCode,
        name: row.protocolTypeName,
      },
    },
    server: {
      id: row.serverId,
      name: row.serverName,
      country: row.serverCountry,
    },
  }
}
