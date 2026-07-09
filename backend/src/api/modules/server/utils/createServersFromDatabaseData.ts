import type { Server } from "@spurro/shared"
import type { findServers } from "../queries/findServers.js"

type ServerRow = Awaited<ReturnType<typeof findServers>>[number]

export function createServersFromDatabaseData(rows: ServerRow[]): Server[] {
  const serversById = new Map<string, Server>()
  const order: string[] = []

  for (const row of rows) {
    let server = serversById.get(row.id)
    if (!server) {
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
      order.push(row.id)
    }

    if (row.endpointId !== null) {
      server.endpoints.push({
        id: row.endpointId,
        port: row.endpointPort!,
        status: row.endpointStatus!,
        protocol: {
          id: row.protocolId!,
          code: row.protocolCode! as Server["endpoints"][number]["protocol"]["code"],
          family: row.protocolFamily!,
          name: row.protocolName!,
        },
      })
    }
  }

  return order.map((id) => serversById.get(id)!)
}
