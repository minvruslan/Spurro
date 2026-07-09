import { cp, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { execa, type Options } from "execa"
import { ServerAccessSchema, type ServerAccess } from "@spurro/shared/infrastructure"
import { DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER, PROJECT_NAME } from "./constants/index.js"
import { assertAnsibleAssetExists, assertRemoteCommandRunnerImageExists } from "./utils/index.js"

const SSH_CONNECT_TIMEOUT_SECONDS = 15
const SSH_COMMAND_TIMEOUT_MS = 5 * 60 * 1000
const ANSIBLE_PLAYBOOK_TIMEOUT_MS = 30 * 60 * 1000

const ANSIBLE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "ansible")
const BOOTSTRAP_SERVER_ANSIBLE_PLAYBOOK_FILENAME = "bootstrap-server.yml"

const ANSIBLE_MOUNT_PATH = "/ansible"
const ANSIBLE_VARIABLES_MOUNT_PATH = "/vars.json"
const SSH_PASSWORD_MOUNT_PATH = "/ssh-password"

const CONTAINER_SCRIPT_ARGUMENT_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

const TEMP_ANSIBLE_ROLE_NAME = "target"
const TEMP_ANSIBLE_PLAYBOOK_FILENAME = "playbook.yml"
const TEMP_ANSIBLE_PLAYBOOK_CONTENT = [
  "- hosts: all",
  "  become: true",
  "  roles:",
  `    - ${TEMP_ANSIBLE_ROLE_NAME}`,
  "",
].join("\n")

export class RemoteCommandRunner {
  private readonly serverAccess: ServerAccess

  constructor(serverAccess: ServerAccess) {
    this.serverAccess = ServerAccessSchema.parse(serverAccess)
  }

  executeContainerScript(
    remoteContainerName: string,
    remoteScriptName: string,
    remoteStdin?: string,
  ): Promise<string> {
    this.assertContainerScriptArguments(remoteContainerName, remoteScriptName)
    return this.execute(`docker exec -i ${remoteContainerName} ${remoteScriptName}`, remoteStdin)
  }

  executeContainerScriptForEachLine(
    remoteContainerName: string,
    remoteScriptName: string,
    remoteStdinLines: string[],
  ): Promise<string> {
    this.assertContainerScriptArguments(remoteContainerName, remoteScriptName)
    for (const line of remoteStdinLines) {
      if (!line || line.includes("\n")) {
        throw new Error(
          `[remote-command-runner] container script stdin line must be a non-empty single line`,
        )
      }
    }
    return this.execute(
      `while IFS= read -r line; do printf '%s\\n' "$line" | docker exec -i ${remoteContainerName} ${remoteScriptName} || exit 1; done`,
      `${remoteStdinLines.join("\n")}\n`,
    )
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

  async runAnsibleRole(roleDirectory: string, variables: Record<string, unknown>): Promise<void> {
    const playbookDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ansible-playbook-`))

    try {
      await writeFile(
        join(playbookDirectory, TEMP_ANSIBLE_PLAYBOOK_FILENAME),
        TEMP_ANSIBLE_PLAYBOOK_CONTENT,
      )

      await cp(roleDirectory, join(playbookDirectory, "roles", TEMP_ANSIBLE_ROLE_NAME), {
        recursive: true,
      })

      await this.runAnsiblePlaybook(playbookDirectory, TEMP_ANSIBLE_PLAYBOOK_FILENAME, variables)
    } finally {
      await rm(playbookDirectory, { recursive: true, force: true })
    }
  }

  async bootstrapServer(serviceUsername: string, serviceBaseDirectory: string): Promise<void> {
    await this.runAnsiblePlaybook(ANSIBLE_DIRECTORY, BOOTSTRAP_SERVER_ANSIBLE_PLAYBOOK_FILENAME, {
      service_username: serviceUsername,
      service_base_directory: serviceBaseDirectory,
    })
  }

  private async execute(remoteCommand: string, remoteStdin?: string): Promise<string> {
    const workDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ssh-`))

    try {
      const passwordPath = join(workDirectory, "password")
      await writeFile(passwordPath, this.serverAccess.password, { mode: 0o600 })

      return await this.runInRunnerImage(
        ["-i", "-v", `${passwordPath}:${SSH_PASSWORD_MOUNT_PATH}:ro`],
        [
          "sshpass",
          "-f",
          SSH_PASSWORD_MOUNT_PATH,
          "ssh",
          "-o",
          "StrictHostKeyChecking=no",
          "-o",
          "UserKnownHostsFile=/dev/null",
          "-o",
          `ConnectTimeout=${SSH_CONNECT_TIMEOUT_SECONDS}`,
          `${this.serverAccess.login}@${this.serverAccess.ip}`,
          remoteCommand,
        ],
        {
          input: remoteStdin,
          timeout: SSH_COMMAND_TIMEOUT_MS,
        },
      )
    } finally {
      await rm(workDirectory, { recursive: true, force: true })
    }
  }

  private async runAnsiblePlaybook(
    playbookDirectory: string,
    playbookFilename: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    await assertAnsibleAssetExists(join(playbookDirectory, playbookFilename))

    const workDirectory = await mkdtemp(join(tmpdir(), `${PROJECT_NAME}-ansible-vars-`))

    try {
      const variablesPath = join(workDirectory, "vars.json")

      await writeFile(
        variablesPath,
        JSON.stringify({
          ansible_user: this.serverAccess.login,
          ansible_password: this.serverAccess.password,
          ansible_become_password: this.serverAccess.password,
          ...variables,
        }),
        { mode: 0o600 },
      )

      await this.runInRunnerImage(
        [
          "-e",
          "ANSIBLE_HOST_KEY_CHECKING=false",
          "-e",
          "ANSIBLE_RETRY_FILES_ENABLED=false",
          "-e",
          "ANSIBLE_CALLBACK_RESULT_FORMAT=yaml",
          "-e",
          "ANSIBLE_PYTHON_INTERPRETER=auto_silent",
          "-v",
          `${playbookDirectory}:${ANSIBLE_MOUNT_PATH}:ro`,
          "-v",
          `${variablesPath}:${ANSIBLE_VARIABLES_MOUNT_PATH}:ro`,
        ],
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
      await rm(workDirectory, { recursive: true, force: true })
    }
  }

  private async runInRunnerImage(
    dockerFlags: string[],
    command: string[],
    options: Options = {},
  ): Promise<string> {
    await assertRemoteCommandRunnerImageExists(DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER.name)

    const { stdout } = await execa(
      "docker",
      [
        "run",
        "--rm",
        "--pull=never",
        ...dockerFlags,
        DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER.name,
        ...command,
      ],
      options,
    )
    if (typeof stdout === "string") return stdout
    if (options.stdout === "inherit") return ""
    throw new Error(`[remote-command-runner] no stdout captured from: ${command.join(" ")}`)
  }
}
