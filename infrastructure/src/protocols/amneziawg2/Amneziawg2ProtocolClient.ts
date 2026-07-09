import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { SupportedProtocolCode } from "@spurro/shared"
import {
  Amneziawg2EndpointContractSchema,
  type Amneziawg2EndpointContract,
  type EndpointContract,
  type ServerAccess,
  type ServerContract,
} from "@spurro/shared/infrastructure"
import { RemoteCommandRunner } from "../../remote-command-runner/RemoteCommandRunner.js"
import { Amneziawg2CreatedAccessSchema, type RevisionCompatibility } from "./types/index.js"
import {
  buildClientConfiguration,
  extractField,
  findClientPublicKeyByClientIP,
  generateServerKeyPair,
  parseObfuscation,
} from "./utils/index.js"

const AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "ansible",
)
const AMNEZIAWG2_PROTOCOL_CODE = "amneziawg2" satisfies SupportedProtocolCode
const AMNEZIAWG2_VERSION = "0.2.19"
const AMNEZIAWG2_CLIENT_REVISION = 1
const AMNEZIAWG2_CLIENT_SUPPORTED_REVISION = 1

export class Amneziawg2ProtocolClient {
  readonly protocolCode = AMNEZIAWG2_PROTOCOL_CODE
  readonly version = AMNEZIAWG2_VERSION
  readonly clientRevision = AMNEZIAWG2_CLIENT_REVISION
  readonly clientSupportedRevision = AMNEZIAWG2_CLIENT_SUPPORTED_REVISION

  static assertEndpointContract(contract: EndpointContract): Amneziawg2EndpointContract {
    return Amneziawg2EndpointContractSchema.parse(contract)
  }

  assessRevisionCompatibility(revision: number | undefined): RevisionCompatibility {
    if (revision === undefined) return "not_deployed"
    if (revision < this.clientSupportedRevision) return "requires_migration"
    if (revision > this.clientRevision) return "newer_than_code"
    return "supported"
  }

  createEndpointContract(port: number): Amneziawg2EndpointContract {
    const serverKeyPair = generateServerKeyPair()
    return {
      protocolCode: this.protocolCode,
      port: port,
      containerName: "amneziawg2",
      stateVolumeName: "amneziawg2_state",
      stateDirectory: "/opt/amneziawg2",
      interfaceName: "wg0",
      subnetPrefix: "10.8.1",
      serverPrivateKey: serverKeyPair.privateKey,
      serverPublicKey: serverKeyPair.publicKey,
    }
  }

  async deploy(
    serverAccess: ServerAccess,
    serverContract: ServerContract,
    endpointContract: Amneziawg2EndpointContract,
  ): Promise<void> {
    await new RemoteCommandRunner(serverAccess).runAnsibleRole(AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY, {
      service_username: serverContract.service.username,
      amneziawg2_version: this.version,
      amneziawg2_port: endpointContract.port,
      amneziawg2_address: `${endpointContract.subnetPrefix}.1/24`,
      amneziawg2_deploy_directory: `${serverContract.service.baseDirectory}/${this.protocolCode}`,
      amneziawg2_container_name: endpointContract.containerName,
      amneziawg2_state_volume_name: endpointContract.stateVolumeName,
      amneziawg2_state_directory: endpointContract.stateDirectory,
      amneziawg2_interface_name: endpointContract.interfaceName,
      amneziawg2_server_private_key: endpointContract.serverPrivateKey,
      amneziawg2_server_public_key: endpointContract.serverPublicKey,
    })
  }

  async createAccess(
    serverAccess: ServerAccess,
    serverContract: ServerContract,
    endpointContract: Amneziawg2EndpointContract,
    clientIP: string,
  ): Promise<{
    clientIP: string
    clientPublicKey: string
    presharedKey: string
    clientConfiguration: string
  }> {
    const remoteCommandRunner = new RemoteCommandRunner(serverAccess)

    const output = await remoteCommandRunner.executeContainerScript(
      endpointContract.containerName,
      "create-access.sh",
      clientIP,
    )

    const parsed = Amneziawg2CreatedAccessSchema.safeParse({
      clientPrivateKey: extractField(output, "PRIVATE_KEY"),
      clientPublicKey: extractField(output, "PUBLIC_KEY"),
      serverPublicKey: extractField(output, "SERVER_PUBLIC_KEY"),
      presharedKey: extractField(output, "PRESHARED_KEY"),
      obfuscation: parseObfuscation(
        output.match(/OBFUSCATION_BEGIN\n([\s\S]*?)\nOBFUSCATION_END/)?.[1] ?? "",
      ),
    })

    if (!parsed.success) {
      throw new Error(
        `[amneziawg2] create-access.sh output failed validation: ${parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`,
      )
    }

    const createdAccess = parsed.data

    const clientConfiguration = buildClientConfiguration({
      clientPrivateKey: createdAccess.clientPrivateKey,
      clientIP,
      serverPublicKey: createdAccess.serverPublicKey,
      presharedKey: createdAccess.presharedKey,
      serverEndpoint: `${serverContract.domain ?? serverContract.ip}:${endpointContract.port}`,
      obfuscation: createdAccess.obfuscation,
      dns: serverContract.dns,
    })

    return {
      clientIP,
      clientPublicKey: createdAccess.clientPublicKey,
      presharedKey: createdAccess.presharedKey,
      clientConfiguration,
    }
  }

  async deleteAccess(
    serverAccess: ServerAccess,
    endpointContract: Amneziawg2EndpointContract,
    target: { clientPublicKey?: string; clientIP?: string },
  ): Promise<void> {
    const remoteCommandRunner = new RemoteCommandRunner(serverAccess)

    let clientPublicKey = target.clientPublicKey

    if (!clientPublicKey) {
      if (!target.clientIP) {
        throw new Error("[amneziawg2] deleteAccess requires clientPublicKey or clientIP")
      }

      clientPublicKey = await findClientPublicKeyByClientIP(
        remoteCommandRunner,
        endpointContract.containerName,
        target.clientIP,
      )

      if (!clientPublicKey) return
    }

    await remoteCommandRunner.executeContainerScript(
      endpointContract.containerName,
      "delete-access.sh",
      clientPublicKey,
    )
  }

  async deleteAccesses(
    serverAccess: ServerAccess,
    endpointContract: Amneziawg2EndpointContract,
    clientPublicKeys: string[],
  ): Promise<void> {
    if (clientPublicKeys.length === 0) return

    await new RemoteCommandRunner(serverAccess).executeContainerScriptForEachLine(
      endpointContract.containerName,
      "delete-access.sh",
      clientPublicKeys,
    )
  }
}
