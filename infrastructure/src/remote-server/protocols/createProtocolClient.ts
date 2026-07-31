import type { ProtocolCode } from "../../types/index.js"
import type { RemoteCommandRunner } from "../../remote-command-runner/index.js"
import { Amneziawg2Client } from "./amneziawg2/index.js"

const PROTOCOL_CLIENT_FACTORIES = {
  amneziawg2: (remoteCommandRunner: RemoteCommandRunner) =>
    new Amneziawg2Client(remoteCommandRunner),
} satisfies Record<ProtocolCode, (remoteCommandRunner: RemoteCommandRunner) => unknown>

export function createProtocolClient(
  protocolCode: ProtocolCode,
  remoteCommandRunner: RemoteCommandRunner,
) {
  return PROTOCOL_CLIENT_FACTORIES[protocolCode](remoteCommandRunner)
}
