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
  type TransportProtocol,
} from "@spurro/shared"
import type { ServerAccess } from "@spurro/shared/infrastructure"
import { PROJECT_NAME } from "../common/constants/index.js"
import { CommandRunner } from "../command-runner/index.js"
import { RemoteCommandRunner } from "../remote-command-runner/index.js"

const ANSIBLE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "ansible")
const BOOTSTRAP_SERVER_ANSIBLE_PLAYBOOK_FILENAME = "bootstrap-server.yml"
const SSH_KEYSCAN_TIMEOUT_SECONDS = 15
const SSH_PRIVATE_KEY_MOUNT_PATH = "/ssh-private-key"

export class ServerProvisioner {
  private readonly remoteCommandRunner: RemoteCommandRunner

  constructor(serverAccess: ServerAccess) {
    this.remoteCommandRunner = new RemoteCommandRunner(serverAccess)
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
      throw new Error(`[server-provisioner] ssh-keyscan returned no host keys for ${parsedIp}`)
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
        throw new Error("[server-provisioner] ssh-keygen produced no public key")
      }

      return publicKey
    } finally {
      await rm(localTmpDirectory, { recursive: true, force: true })
    }
  }

  bootstrap(serviceUsername: string, serviceBaseDirectory: string): Promise<void> {
    return this.remoteCommandRunner.runAnsiblePlaybook(
      ANSIBLE_DIRECTORY,
      BOOTSTRAP_SERVER_ANSIBLE_PLAYBOOK_FILENAME,
      {
        service_username: UnixUsernameSchema.parse(serviceUsername),
        service_base_directory: UnixPathSchema.parse(serviceBaseDirectory),
      },
    )
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

  assertConnectivity(): Promise<void> {
    return this.remoteCommandRunner.assertConnectivity()
  }

  async assertPrivilegeEscalation(): Promise<void> {
    await this.remoteCommandRunner.execute("sudo -n true")
  }

  harden(sshPort: number): Promise<void> {
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
}
