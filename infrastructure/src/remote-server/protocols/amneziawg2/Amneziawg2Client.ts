import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import {
  Amneziawg2ObfuscationOptionsSchema,
  IpSchema,
  PortSchema,
  type Amneziawg2ClientIdentifier,
  type Amneziawg2ConfigData,
  type ConfigClientIdentifier,
  type ConfigData,
  type ConfigProtocolOptions,
  type ProtocolCode,
} from "../../../types/index.js"
import {
  Amneziawg2EndpointActualStateSchema,
  Amneziawg2EndpointDesiredStateSchema,
  Amneziawg2KeySchema,
  type Amneziawg2EndpointActualState,
  type Amneziawg2EndpointDesiredState,
  type EndpointActualState,
  type EndpointDesiredState,
  type ServerDesiredState,
} from "../../../types/index.js"
import type { RemoteCommandRunner } from "../../../remote-command-runner/index.js"
import { TUNNEL_MTU } from "./constants/index.js"
import type { Amneziawg2Access } from "./types/index.js"
import {
  buildClientConfiguration,
  findClientPublicKeyByClientIp,
  generateClientObfuscation,
  generateEndpointObfuscation,
  generateKeyPair,
  generatePresharedKey,
  pickFreeClientIp,
} from "./utils/index.js"

const AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "ansible",
)
const AMNEZIAWG2_PROTOCOL_CODE = "amneziawg2" satisfies ProtocolCode
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

  parseEndpointDesiredState(desiredState: EndpointDesiredState): Amneziawg2EndpointDesiredState {
    return Amneziawg2EndpointDesiredStateSchema.parse(desiredState)
  }

  parseEndpointActualState(actualState: EndpointActualState): Amneziawg2EndpointActualState {
    return Amneziawg2EndpointActualStateSchema.parse(actualState)
  }

  createEndpointDesiredState(
    port: number,
    host: string,
    dns: string,
  ): Amneziawg2EndpointDesiredState {
    const parsedPort = PortSchema.parse(port)
    const serverKeyPair = generateKeyPair()

    return {
      protocolCode: this.protocolCode,
      host: Amneziawg2EndpointDesiredStateSchema.shape.host.parse(host),
      dns: Amneziawg2EndpointDesiredStateSchema.shape.dns.parse(dns),
      dockerImageVersion: this.dockerImageVersion,
      port: parsedPort,
      containerName: AMNEZIAWG2_CONTAINER_NAME,
      stateVolumeName: AMNEZIAWG2_STATE_VOLUME_NAME,
      stateDirectory: AMNEZIAWG2_STATE_DIRECTORY,
      interfaceName: AMNEZIAWG2_INTERFACE_NAME,
      subnetPrefix: AMNEZIAWG2_SUBNET_PREFIX,
      serverPrivateKey: serverKeyPair.privateKey,
      serverPublicKey: serverKeyPair.publicKey,
      obfuscation: generateEndpointObfuscation(),
    }
  }

  allocateClientIdentifier(
    endpointActualState: EndpointActualState,
    reservedClientIdentifiers: (string | null)[],
  ): Amneziawg2ClientIdentifier | null {
    const actualState = this.parseEndpointActualState(endpointActualState)
    return pickFreeClientIp(reservedClientIdentifiers, actualState.subnetPrefix)
  }

  createInitialConfigData(
    clientIdentifier: ConfigClientIdentifier,
    protocolOptions: ConfigProtocolOptions,
  ): Amneziawg2ConfigData {
    return {
      protocolCode: this.protocolCode,
      clientIp: IpSchema.parse(clientIdentifier),
      options: Amneziawg2ObfuscationOptionsSchema.parse(protocolOptions),
    }
  }

  async install(
    server: { desiredState: ServerDesiredState },
    endpointDesiredState: EndpointDesiredState,
  ): Promise<void> {
    const desiredState = this.parseEndpointDesiredState(endpointDesiredState)

    await this.remoteCommandRunner.runAnsibleRole(AMNEZIAWG2_ANSIBLE_ROLE_DIRECTORY, {
      service_username: server.desiredState.ssh.username,
      amneziawg2_docker_image_version: desiredState.dockerImageVersion,
      amneziawg2_port: desiredState.port,
      amneziawg2_mtu: TUNNEL_MTU,
      amneziawg2_address: `${desiredState.subnetPrefix}.1/24`,
      amneziawg2_deploy_directory: `${server.desiredState.baseDirectory}/${this.protocolCode}`,
      amneziawg2_container_name: desiredState.containerName,
      amneziawg2_state_volume_name: desiredState.stateVolumeName,
      amneziawg2_state_directory: desiredState.stateDirectory,
      amneziawg2_interface_name: desiredState.interfaceName,
      amneziawg2_server_private_key: desiredState.serverPrivateKey,
      amneziawg2_server_public_key: desiredState.serverPublicKey,
      amneziawg2_obfuscation: desiredState.obfuscation,
    })
  }

  async createAccess(
    endpointActualState: EndpointActualState,
    clientIdentifier: ConfigClientIdentifier,
    protocolOptions: ConfigProtocolOptions,
  ): Promise<{ configData: Amneziawg2ConfigData; clientConfiguration: string }> {
    const actualState = this.parseEndpointActualState(endpointActualState)
    const obfuscationOptions = Amneziawg2ObfuscationOptionsSchema.parse(protocolOptions)
    const clientIp = IpSchema.parse(clientIdentifier)

    const clientKeyPair = generateKeyPair()
    const presharedKey = generatePresharedKey()

    const clientConfiguration = buildClientConfiguration({
      clientPrivateKey: clientKeyPair.privateKey,
      clientIp,
      serverPublicKey: actualState.serverPublicKey,
      presharedKey,
      serverEndpoint: `${actualState.host}:${actualState.port}`,
      serverObfuscation: actualState.obfuscation,
      clientObfuscation: generateClientObfuscation(obfuscationOptions),
      dns: actualState.dns,
    })

    await this.applyAccesses(actualState, [
      { publicKey: clientKeyPair.publicKey, presharedKey, clientIp },
    ])

    return {
      configData: {
        ...this.createInitialConfigData(clientIdentifier, protocolOptions),
        publicKey: clientKeyPair.publicKey,
        presharedKey,
      },
      clientConfiguration,
    }
  }

  async applyAccesses(
    endpointActualState: EndpointActualState,
    accesses: Amneziawg2Access[],
  ): Promise<void> {
    if (accesses.length === 0) return

    const actualState = this.parseEndpointActualState(endpointActualState)

    const lines = accesses.map((access) => {
      const publicKey = Amneziawg2KeySchema.parse(access.publicKey)
      const presharedKey = Amneziawg2KeySchema.parse(access.presharedKey)
      const clientIp = IpSchema.parse(access.clientIp)
      return `${publicKey} ${presharedKey} ${clientIp}\n`
    })

    await this.remoteCommandRunner.executeContainerScript(
      actualState.containerName,
      "apply-peers.sh",
      lines.join(""),
    )
  }

  async deleteAccessByClientIdentifier(
    endpointActualState: EndpointActualState,
    clientIdentifier: ConfigClientIdentifier,
  ): Promise<void> {
    const actualState = this.parseEndpointActualState(endpointActualState)

    const clientPublicKey = await findClientPublicKeyByClientIp(
      this.remoteCommandRunner,
      actualState.containerName,
      IpSchema.parse(clientIdentifier),
    )

    if (!clientPublicKey) return

    await this.deleteClientPublicKeys(actualState, [clientPublicKey])
  }

  async deleteAccesses(
    endpointActualState: EndpointActualState,
    configDatas: (ConfigData | null)[],
  ): Promise<void> {
    const actualState = this.parseEndpointActualState(endpointActualState)

    const clientPublicKeys = configDatas
      .filter(
        (configData): configData is Amneziawg2ConfigData =>
          configData?.protocolCode === this.protocolCode,
      )
      .map((configData) => configData.publicKey)
      .filter((publicKey): publicKey is string => Boolean(publicKey))

    await this.deleteClientPublicKeys(actualState, clientPublicKeys)
  }

  private async deleteClientPublicKeys(
    endpointActualState: Amneziawg2EndpointActualState,
    clientPublicKeys: string[],
  ): Promise<void> {
    if (clientPublicKeys.length === 0) return

    const parsedClientPublicKeys = z.array(Amneziawg2KeySchema).parse(clientPublicKeys)

    await this.remoteCommandRunner.executeContainerScript(
      endpointActualState.containerName,
      "delete-accesses.sh",
      parsedClientPublicKeys.map((clientPublicKey) => `${clientPublicKey}\n`).join(""),
    )
  }
}
