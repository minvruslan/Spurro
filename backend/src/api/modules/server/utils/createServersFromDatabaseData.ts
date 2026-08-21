import type { Server } from "@vancloak/api-contract"
import { ProtocolCodeSchema } from "@vancloak/api-contract"
import type { findServers } from "../queries/findServers.js"

type ServerRow = Awaited<ReturnType<typeof findServers>>[number]

export function createServersFromDatabaseData(rows: ServerRow[]): Server[] {
  const serversById = new Map<string, Server>()
  const servers: Server[] = []

  for (const row of rows) {
    let server = serversById.get(row.id)
    /* v8 ignore start -- a repeated server row needs two endpoints on one server, unrepresentable until a second protocol exists */
    if (!server) {
      /* v8 ignore stop */
      server = {
        id: row.id,
        name: row.name,
        domainName: row.domainName,
        ip: row.ip,
        country: row.country,
        status: row.status,
        isCurrent: row.isCurrent,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        endpoints: [],
      }
      serversById.set(row.id, server)
      servers.push(server)
    }

    if (
      row.endpointId === null ||
      row.endpointPort === null ||
      row.endpointStatus === null ||
      row.protocolId === null ||
      row.protocolCode === null ||
      row.protocolFamily === null ||
      row.protocolName === null
    ) {
      continue
    }

    server.endpoints.push({
      id: row.endpointId,
      port: row.endpointPort,
      status: row.endpointStatus,
      protocol: {
        id: row.protocolId,
        code: ProtocolCodeSchema.parse(row.protocolCode),
        family: row.protocolFamily,
        name: row.protocolName,
      },
    })
  }

  return servers
}
