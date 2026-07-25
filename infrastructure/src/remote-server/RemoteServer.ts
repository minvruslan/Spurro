import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import {
  IPSchema,
  PortSchema,
  TransportProtocolSchema,
  UnixPathSchema,
  UnixUsernameSchema,
  type SupportedProtocolCode,
  type TransportProtocol,
} from "@spurro/shared"
import {
  ServerContractSchema,
  type EndpointContract,
  type ServerAccess,
  type ServerContract,
  type ServerData,
} from "../types/index.js"
import { PROJECT_NAME } from "../common/constants/index.js"
import { CommandRunner } from "../command-runner/index.js"
import { RemoteCommandRunner } from "../remote-command-runner/index.js"
import { createProtocolClient } from "./protocols/index.js"

const ANSIBLE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "ansible")
const SSH_KEYSCAN_TIMEOUT_SECONDS = 15
const SSH_PRIVATE_KEY_MOUNT_PATH = "/ssh-private-key"

export class RemoteServer {
  private readonly remoteCommandRunner: RemoteCommandRunner

  constructor(serverAccess: ServerAccess) {
    this.remoteCommandRunner = new RemoteCommandRunner(serverAccess)
  }

  static buildServerAccess(
    server: { ip: string; data: ServerData },
    appSshPrivateKey: string,
  ): ServerAccess | null {
    const state = server.data.state
    const sshHostKeys = state.sshHostKeys
    if (!sshHostKeys?.length) return null

    if ("hardenedAt" in state.ssh) {
      return RemoteServer.buildServiceUserServerAccess(server, appSshPrivateKey)
    }

    return {
      ip: server.ip,
      port: state.ssh.port,
      username: state.ssh.username,
      password: state.ssh.password,
      sshHostKeys,
    }
  }

  static buildServiceUserServerAccess(
    server: { ip: string; data: ServerData },
    appSshPrivateKey: string,
  ): ServerAccess | null {
    const serverContract = ServerContractSchema.safeParse(server.data.contract)
    const sshHostKeys = server.data.state.sshHostKeys
    if (!serverContract.success || !sshHostKeys?.length) return null

    return {
      ip: server.ip,
      port: serverContract.data.sshPort,
      username: serverContract.data.service.username,
      privateKey: appSshPrivateKey,
      sshHostKeys,
    }
  }

  static async scanSSHHostKeys(ip: string, port: number): Promise<string[]> {
    const parsedIp = IPSchema.parse(ip)
    const parsedPort = PortSchema.parse(port)

    const stdout = await CommandRunner.run(
      [],
      [
        "ssh-keyscan",
        "-T",
        String(SSH_KEYSCAN_TIMEOUT_SECONDS),
        "-p",
        String(parsedPort),
        parsedIp,
      ],
    )

    const sshHostKeys = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split(/\s+/).slice(1).join(" "))
      .sort()

    if (sshHostKeys.length === 0) {
      throw new Error(`SSH host key scan returned no keys for ${parsedIp}.`)
    }

    return sshHostKeys
  }

  static async deriveSSHPublicKey(privateKey: string): Promise<string> {
    const localTmpDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ssh-public-key-`))

    try {
      const localPrivateKeyPath = join(localTmpDirectory, "private-key")
      await writeFile(localPrivateKeyPath, privateKey, { mode: 0o600 })

      const stdout = await CommandRunner.run(
        ["-v", `${localPrivateKeyPath}:${SSH_PRIVATE_KEY_MOUNT_PATH}:ro`],
        ["ssh-keygen", "-y", "-f", SSH_PRIVATE_KEY_MOUNT_PATH],
      )

      const publicKey = stdout.trim()
      if (!publicKey) {
        throw new Error("SSH public key derivation produced no output.")
      }

      return publicKey
    } finally {
      await rm(localTmpDirectory, { recursive: true, force: true })
    }
  }

  assertConnectivity(): Promise<void> {
    return this.remoteCommandRunner.assertConnectivity()
  }

  async assertPrivilegeEscalation(): Promise<void> {
    await this.remoteCommandRunner.execute("sudo -n true")
  }

  installDocker(): Promise<void> {
    return this.remoteCommandRunner.runAnsibleRole(join(ANSIBLE_DIRECTORY, "roles", "docker"), {})
  }

  createServiceUser(serviceUsername: string, serviceBaseDirectory: string): Promise<void> {
    return this.remoteCommandRunner.runAnsibleRole(join(ANSIBLE_DIRECTORY, "roles", "user"), {
      service_username: UnixUsernameSchema.parse(serviceUsername),
      service_base_directory: UnixPathSchema.parse(serviceBaseDirectory),
    })
  }

  installServiceUserAuthorizedKeys(
    serviceUsername: string,
    authorizedKeys: string[],
  ): Promise<void> {
    return this.remoteCommandRunner.runAnsibleRole(
      join(ANSIBLE_DIRECTORY, "roles", "authorized-keys"),
      {
        service_username: UnixUsernameSchema.parse(serviceUsername),
        service_authorized_keys: z.array(z.string().min(1)).min(1).parse(authorizedKeys),
      },
    )
  }

  hardenSSHAccess(sshPort: number): Promise<void> {
    return this.remoteCommandRunner.runAnsibleRole(join(ANSIBLE_DIRECTORY, "roles", "hardening"), {
      hardening_ssh_port: PortSchema.parse(sshPort),
    })
  }

  allowFirewallPort(port: number, transportProtocol: TransportProtocol): Promise<void> {
    return this.remoteCommandRunner.runAnsibleRole(
      join(ANSIBLE_DIRECTORY, "roles", "firewall-allow-port"),
      {
        firewall_port: PortSchema.parse(port),
        firewall_transport_protocol: TransportProtocolSchema.parse(transportProtocol),
      },
    )
  }

  async install(
    protocolCode: SupportedProtocolCode,
    serverContract: ServerContract,
    endpointContract: EndpointContract,
  ): Promise<void> {
    await this.getProtocolClient(protocolCode).install(serverContract, endpointContract)
  }

  getProtocolClient(protocolCode: SupportedProtocolCode) {
    return createProtocolClient(protocolCode, this.remoteCommandRunner)
  }
}
