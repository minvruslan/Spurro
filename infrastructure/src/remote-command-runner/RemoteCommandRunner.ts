import { cp, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ServerAccessSchema, type ServerAccess } from "@spurro/shared/infrastructure"
import { PROJECT_NAME } from "../common/constants/index.js"
import { CommandRunner } from "../command-runner/index.js"
import { assertAnsibleAssetExists } from "./utils/index.js"

const SSH_DEFAULT_PORT = 22
const SSH_CONNECT_TIMEOUT_SECONDS = 15
const SSH_COMMAND_TIMEOUT_MS = 5 * 60 * 1000
const ANSIBLE_PLAYBOOK_TIMEOUT_MS = 30 * 60 * 1000

const ANSIBLE_MOUNT_PATH = "/ansible"
const ANSIBLE_VARIABLES_MOUNT_PATH = "/vars.json"
const SSH_PASSWORD_MOUNT_PATH = "/ssh-password"
const SSH_PRIVATE_KEY_MOUNT_PATH = "/ssh-private-key"
const SSH_KNOWN_HOSTS_MOUNT_PATH = "/ssh-known-hosts"

const CONTAINER_SCRIPT_ARGUMENT_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

const TMP_ANSIBLE_ROLE_NAME = "target"
const TMP_ANSIBLE_PLAYBOOK_FILENAME = "playbook.yml"
const TMP_ANSIBLE_PLAYBOOK_CONTENT = [
  "- hosts: all",
  "  become: true",
  "  roles:",
  `    - ${TMP_ANSIBLE_ROLE_NAME}`,
  "",
].join("\n")

export class RemoteCommandRunner {
  private readonly serverAccess: ServerAccess

  constructor(serverAccess: ServerAccess) {
    this.serverAccess = ServerAccessSchema.parse(serverAccess)
  }

  async assertConnectivity(): Promise<void> {
    await this.execute("true")
  }

  executeContainerScript(
    remoteContainerName: string,
    remoteScriptName: string,
    remoteStdin?: string,
  ): Promise<string> {
    this.assertContainerScriptArguments(remoteContainerName, remoteScriptName)
    return this.execute(`docker exec -i ${remoteContainerName} ${remoteScriptName}`, remoteStdin)
  }

  async runAnsibleRole(roleDirectory: string, variables: Record<string, unknown>): Promise<void> {
    const localPlaybookDirectory = await mkdtemp(
      join(tmpdir(), `${PROJECT_NAME}-ansible-playbook-`),
    )

    try {
      await writeFile(
        join(localPlaybookDirectory, TMP_ANSIBLE_PLAYBOOK_FILENAME),
        TMP_ANSIBLE_PLAYBOOK_CONTENT,
      )

      await cp(roleDirectory, join(localPlaybookDirectory, "roles", TMP_ANSIBLE_ROLE_NAME), {
        recursive: true,
      })

      await this.runAnsiblePlaybook(
        localPlaybookDirectory,
        TMP_ANSIBLE_PLAYBOOK_FILENAME,
        variables,
      )
    } finally {
      await rm(localPlaybookDirectory, { recursive: true, force: true })
    }
  }

  async execute(remoteCommand: string, remoteStdin?: string): Promise<string> {
    const localTmpDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ssh-`))

    try {
      const profile = await this.buildConnectionProfile(localTmpDirectory)
      const dockerFlags = ["-i", ...profile.mounts]

      const sshOptions = [
        "-p",
        String(this.serverAccess.port),
        "-o",
        "StrictHostKeyChecking=yes",
        "-o",
        `UserKnownHostsFile=${SSH_KNOWN_HOSTS_MOUNT_PATH}`,
        "-o",
        `ConnectTimeout=${SSH_CONNECT_TIMEOUT_SECONDS}`,
      ]

      const destination = `${this.serverAccess.username}@${this.serverAccess.ip}`

      const command = [...profile.ssh.commandPrefix, ...sshOptions, destination, remoteCommand]

      return await CommandRunner.run(dockerFlags, command, {
        input: remoteStdin,
        timeout: SSH_COMMAND_TIMEOUT_MS,
      })
    } finally {
      await rm(localTmpDirectory, { recursive: true, force: true })
    }
  }

  async runAnsiblePlaybook(
    localPlaybookDirectory: string,
    playbookFilename: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    await assertAnsibleAssetExists(join(localPlaybookDirectory, playbookFilename))

    const localTmpDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ansible-vars-`))

    try {
      const profile = await this.buildConnectionProfile(localTmpDirectory)

      const dockerFlags = [
        "-e",
        "ANSIBLE_RETRY_FILES_ENABLED=false",
        "-e",
        "ANSIBLE_CALLBACK_RESULT_FORMAT=yaml",
        "-e",
        "ANSIBLE_PYTHON_INTERPRETER=auto_silent",
        "-v",
        `${localPlaybookDirectory}:${ANSIBLE_MOUNT_PATH}:ro`,
        ...profile.mounts,
      ]

      const connectionVariables: Record<string, unknown> = {
        ansible_user: this.serverAccess.username,
        ansible_port: this.serverAccess.port,
        ...profile.ansible.variables,
      }

      const sshCommonArguments = [
        "-o",
        "StrictHostKeyChecking=yes",
        "-o",
        `UserKnownHostsFile=${SSH_KNOWN_HOSTS_MOUNT_PATH}`,
        ...profile.ansible.sshArguments,
      ]

      connectionVariables.ansible_ssh_common_args = sshCommonArguments.join(" ")

      const reservedKeys = Object.keys(connectionVariables).filter((key) => key in variables)
      if (reservedKeys.length > 0) {
        throw new Error(
          `[remote-command-runner] variables collide with connection variables: ${reservedKeys.join(", ")}`,
        )
      }

      const localVariablesPath = join(localTmpDirectory, "vars.json")
      await writeFile(
        localVariablesPath,
        JSON.stringify({ ...connectionVariables, ...variables }),
        {
          mode: 0o600,
        },
      )

      dockerFlags.push("-v", `${localVariablesPath}:${ANSIBLE_VARIABLES_MOUNT_PATH}:ro`)

      await CommandRunner.run(
        dockerFlags,
        [
          "ansible-playbook",
          "-i",
          `${this.serverAccess.ip},`,
          "--extra-vars",
          `@${ANSIBLE_VARIABLES_MOUNT_PATH}`,
          `${ANSIBLE_MOUNT_PATH}/${playbookFilename}`,
        ],
        { stdout: "inherit", stderr: "inherit", timeout: ANSIBLE_PLAYBOOK_TIMEOUT_MS },
      )
    } finally {
      await rm(localTmpDirectory, { recursive: true, force: true })
    }
  }

  private assertContainerScriptArguments(
    remoteContainerName: string,
    remoteScriptName: string,
  ): void {
    for (const argument of [remoteContainerName, remoteScriptName]) {
      if (!CONTAINER_SCRIPT_ARGUMENT_PATTERN.test(argument)) {
        throw new Error(`[remote-command-runner] unsafe container script argument: "${argument}"`)
      }
    }
  }

  private async buildConnectionProfile(localTmpDirectory: string): Promise<{
    mounts: string[]
    ssh: { commandPrefix: string[] }
    ansible: { variables: Record<string, unknown>; sshArguments: string[] }
  }> {
    const localKnownHostsPath = join(localTmpDirectory, "known-hosts")
    await writeFile(localKnownHostsPath, this.buildKnownHostsContent(), { mode: 0o600 })

    const mounts = ["-v", `${localKnownHostsPath}:${SSH_KNOWN_HOSTS_MOUNT_PATH}:ro`]

    if ("privateKey" in this.serverAccess) {
      const localPrivateKeyPath = join(localTmpDirectory, "private-key")
      await writeFile(localPrivateKeyPath, this.serverAccess.privateKey, { mode: 0o600 })
      mounts.push("-v", `${localPrivateKeyPath}:${SSH_PRIVATE_KEY_MOUNT_PATH}:ro`)

      const keyOptions = ["-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes"]
      return {
        mounts,
        ssh: { commandPrefix: ["ssh", "-i", SSH_PRIVATE_KEY_MOUNT_PATH, ...keyOptions] },
        ansible: {
          variables: { ansible_ssh_private_key_file: SSH_PRIVATE_KEY_MOUNT_PATH },
          sshArguments: keyOptions,
        },
      }
    }

    const localPasswordPath = join(localTmpDirectory, "password")
    await writeFile(localPasswordPath, this.serverAccess.password, { mode: 0o600 })
    mounts.push("-v", `${localPasswordPath}:${SSH_PASSWORD_MOUNT_PATH}:ro`)

    return {
      mounts,
      ssh: { commandPrefix: ["sshpass", "-f", SSH_PASSWORD_MOUNT_PATH, "ssh"] },
      ansible: {
        variables: {
          ansible_password: this.serverAccess.password,
          ansible_become_password: this.serverAccess.password,
        },
        sshArguments: [],
      },
    }
  }

  private buildKnownHostsContent(): string {
    const { ip, port, sshHostKeys } = this.serverAccess
    const host = port === SSH_DEFAULT_PORT ? ip : `[${ip}]:${port}`
    return sshHostKeys.map((sshHostKey) => `${host} ${sshHostKey}\n`).join("")
  }
}
