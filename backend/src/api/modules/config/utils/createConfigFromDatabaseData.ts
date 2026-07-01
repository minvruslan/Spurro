import type { Config, DeviceType } from "@spurro/shared"
import type { findUserConfigs } from "../queries/findUserConfigs.js"

type ConfigRow = Awaited<ReturnType<typeof findUserConfigs>>[number]

export function createConfigFromDatabaseData(row: ConfigRow): Config {
  return {
    id: row.id,
    name: row.name,
    deviceType: {
      id: row.deviceTypeId,
      code: row.deviceTypeCode as DeviceType["code"],
      name: row.deviceTypeName as DeviceType["name"],
    },
    endpoint: {
      id: row.endpointId,
      port: row.endpointPort,
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
    },
    data: row.data,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
