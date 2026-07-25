import { ServerContractSchema, type ServerContract } from "../types/index.js"

export type ServerContractInput = {
  domain: string | null
  ip: string
  sshPort: number
  dns: string
  serviceUsername: string
  baseDirectory: string
}

export function buildServerContract(input: ServerContractInput): ServerContract {
  return ServerContractSchema.parse({
    domain: input.domain,
    ip: input.ip,
    sshPort: input.sshPort,
    dns: input.dns,
    service: {
      username: input.serviceUsername,
      baseDirectory: input.baseDirectory,
    },
  })
}
