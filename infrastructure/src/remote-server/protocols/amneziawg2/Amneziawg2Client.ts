import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import {
  IPSchema,
  PortSchema,
  type Amneziawg2ClientIdentifier,
  type Amneziawg2ConfigData,
  type ConfigData,
  type SupportedProtocolCode,
} from "@spurro/shared"
import {
  Amneziawg2EndpointContractSchema,
  Amneziawg2KeySchema,
  type Amneziawg2EndpointContract,
  type EndpointContract,
  type ServerContract,
} from "../../../types/index.js"
import type { RemoteCommandRunner } from "../../../remote-command-runner/index.js"
import { Amneziawg2CreatedAccessSchema } from "./types/index.js"
import {
  buildClientConfiguration,
  extractField,
  findClientPublicKeyByClientIP,
  generateServerKeyPair,
  parseObfuscation,
  pickFreeClientIP,
} from "./utils/index.js"

const AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "ansible",
)
const AMNEZIAWG2_PROTOCOL_CODE = "amneziawg2" satisfies SupportedProtocolCode
const AMNEZIAWG2_DOCKER_IMAGE_VERSION = "0.2.19"
const AMNEZIAWG2_CONTAINER_NAME = "amneziawg2"
const AMNEZIAWG2_STATE_VOLUME_NAME = "amneziawg2_state"
const AMNEZIAWG2_STATE_DIRECTORY = "/opt/amneziawg2"
const AMNEZIAWG2_INTERFACE_NAME = "wg0"
const AMNEZIAWG2_SUBNET_PREFIX = "10.8.1"

export class Amneziawg2Client {
  readonly protocolCode = AMNEZIAWG2_PROTOCOL_CODE
  readonly dockerImageVersion = AMNEZIAWG2_DOCKER_IMAGE_VERSION

  private readonly remoteCommandRunner: RemoteCommandRunner

  constructor(remoteCommandRunner: RemoteCommandRunner) {
    this.remoteCommandRunner = remoteCommandRunner
  }

  parseEndpointContract(contract: EndpointContract): Amneziawg2EndpointContract {
    return Amneziawg2EndpointContractSchema.parse(contract)
  }

  createEndpointContract(port: number): Amneziawg2EndpointContract {
    const parsedPort = PortSchema.parse(port)
    const serverKeyPair = generateServerKeyPair()
    return {
      protocolCode: this.protocolCode,
      dockerImageVersion: this.dockerImageVersion,
      port: parsedPort,
      containerName: AMNEZIAWG2_CONTAINER_NAME,
      stateVolumeName: AMNEZIAWG2_STATE_VOLUME_NAME,
      stateDirectory: AMNEZIAWG2_STATE_DIRECTORY,
      interfaceName: AMNEZIAWG2_INTERFACE_NAME,
      subnetPrefix: AMNEZIAWG2_SUBNET_PREFIX,
      serverPrivateKey: serverKeyPair.privateKey,
      serverPublicKey: serverKeyPair.publicKey,
    }
  }

  allocateClientIdentifier(
    endpointContract: EndpointContract,
    reservedClientIdentifiers: (string | null)[],
  ): Amneziawg2ClientIdentifier | null {
    const contract = this.parseEndpointContract(endpointContract)
    return pickFreeClientIP(reservedClientIdentifiers, contract.subnetPrefix)
  }

  createInitialConfigData(clientIdentifier: string): Amneziawg2ConfigData {
    return {
      protocolCode: this.protocolCode,
      ip: IPSchema.parse(clientIdentifier),
    }
  }

  async install(serverContract: ServerContract, endpointContract: EndpointContract): Promise<void> {
    const contract = this.parseEndpointContract(endpointContract)
    await this.remoteCommandRunner.runAnsibleRole(AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY, {
      service_username: serverContract.service.username,
      amneziawg2_docker_image_version: contract.dockerImageVersion,
      amneziawg2_port: contract.port,
      amneziawg2_address: `${contract.subnetPrefix}.1/24`,
      amneziawg2_deploy_directory: `${serverContract.service.baseDirectory}/${this.protocolCode}`,
      amneziawg2_container_name: contract.containerName,
      amneziawg2_state_volume_name: contract.stateVolumeName,
      amneziawg2_state_directory: contract.stateDirectory,
      amneziawg2_interface_name: contract.interfaceName,
      amneziawg2_server_private_key: contract.serverPrivateKey,
      amneziawg2_server_public_key: contract.serverPublicKey,
    })
  }

  async createAccess(
    serverContract: ServerContract,
    endpointContract: EndpointContract,
    clientIdentifier: string,
  ): Promise<{ configData: Amneziawg2ConfigData; clientConfiguration: string }> {
    const contract = this.parseEndpointContract(endpointContract)
    const clientIP = IPSchema.parse(clientIdentifier)

    const output = await this.remoteCommandRunner.executeContainerScript(
      contract.containerName,
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
        `Output of create-access.sh failed validation: ${parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}.`,
      )
    }

    const createdAccess = parsed.data

    const clientConfiguration = buildClientConfiguration({
      clientPrivateKey: createdAccess.clientPrivateKey,
      clientIP,
      serverPublicKey: createdAccess.serverPublicKey,
      presharedKey: createdAccess.presharedKey,
      serverEndpoint: `${serverContract.domain ?? serverContract.ip}:${contract.port}`,
      obfuscation: createdAccess.obfuscation,
      dns: serverContract.dns,
    })

    return {
      configData: {
        ...this.createInitialConfigData(clientIdentifier),
        publicKey: createdAccess.clientPublicKey,
        presharedKey: createdAccess.presharedKey,
      },
      clientConfiguration,
    }
  }

  async deleteAccessByClientIdentifier(
    endpointContract: EndpointContract,
    clientIdentifier: string,
  ): Promise<void> {
    const contract = this.parseEndpointContract(endpointContract)

    const clientPublicKey = await findClientPublicKeyByClientIP(
      this.remoteCommandRunner,
      contract.containerName,
      IPSchema.parse(clientIdentifier),
    )

    if (!clientPublicKey) return

    await this.deleteClientPublicKeys(contract, [clientPublicKey])
  }

  async deleteAccesses(
    endpointContract: EndpointContract,
    configDatas: (ConfigData | null)[],
  ): Promise<void> {
    const contract = this.parseEndpointContract(endpointContract)

    const clientPublicKeys = configDatas
      .filter(
        (configData): configData is Amneziawg2ConfigData =>
          configData?.protocolCode === this.protocolCode,
      )
      .map((configData) => configData.publicKey)
      .filter((publicKey): publicKey is string => Boolean(publicKey))

    await this.deleteClientPublicKeys(contract, clientPublicKeys)
  }

  private async deleteClientPublicKeys(
    endpointContract: Amneziawg2EndpointContract,
    clientPublicKeys: string[],
  ): Promise<void> {
    if (clientPublicKeys.length === 0) return

    const parsedClientPublicKeys = z.array(Amneziawg2KeySchema).parse(clientPublicKeys)

    await this.remoteCommandRunner.executeContainerScript(
      endpointContract.containerName,
      "delete-accesses.sh",
      parsedClientPublicKeys.map((clientPublicKey) => `${clientPublicKey}\n`).join(""),
    )
  }
}
