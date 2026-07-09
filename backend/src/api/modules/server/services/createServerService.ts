import type { UpsertServer, Server } from "@spurro/shared"
import { SUPPORTED_PROTOCOLS, SupportedProtocolCodeSchema, ServerSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import {
  PROVISION_SERVER_JOB_NAME,
  provisionServerQueue,
} from "@/core/queue/provision-server/index.js"
import { deleteServer } from "../queries/deleteServer.js"
import { findProtocolCodes } from "../queries/findProtocolCodes.js"
import { findServerById } from "../queries/findServerById.js"
import { insertEndpoints } from "../queries/insertEndpoints.js"
import { insertServer } from "../queries/insertServer.js"
import { createServersFromDatabaseData } from "../utils/createServersFromDatabaseData.js"

export async function createServerService(input: UpsertServer): Promise<Server> {
  const credentials = input.credentials

  if (!credentials) {
    throw new Error("Server credentials (login/password) are required for provisioning")
  }

  const endpoints = input.endpoints ?? []

  const result = await db.transaction(async (tx) => {
    const protocolCodes = await findProtocolCodes(
      tx,
      endpoints.map((item) => item.protocolId),
    )
    const codeByProtocolId = new Map(protocolCodes.map((row) => [row.protocolId, row.protocolCode]))

    const seenProtocolCodes = new Set<string>()
    const endpointsToInsert = endpoints.map((item) => {
      const code = codeByProtocolId.get(item.protocolId)
      if (!code) {
        throw new Error(`[createServer] protocol ${item.protocolId} not found`)
      }

      const parsedCode = SupportedProtocolCodeSchema.safeParse(code)
      if (!parsedCode.success) {
        throw new Error(`[createServer] unsupported protocol "${code}"`)
      }

      if (seenProtocolCodes.has(code)) {
        throw new Error(
          `[createServer] multiple endpoints of protocol "${code}"; one endpoint per protocol is supported`,
        )
      }
      seenProtocolCodes.add(code)

      return {
        protocolId: item.protocolId,
        port: item.port ?? SUPPORTED_PROTOCOLS[parsedCode.data].defaultPort,
      }
    })

    const [row] = await insertServer(tx, {
      name: input.name,
      domainName: input.domainName ?? null,
      ip: input.ip,
      country: input.country,
      status: "provisioning",
      data: { ssh: { login: credentials.login, password: credentials.password } },
    })

    await insertEndpoints(tx, row.id, endpointsToInsert)

    const rows = await findServerById(tx, row.id)

    return ServerSchema.parse(createServersFromDatabaseData(rows)[0])
  })

  try {
    await provisionServerQueue().add(PROVISION_SERVER_JOB_NAME, {
      serverId: result.id,
    })
  } catch (error) {
    await deleteServer(db, result.id).catch((rollbackError) =>
      console.error("[createServer] rollback failed", result.id, rollbackError),
    )
    throw error
  }

  return result
}
