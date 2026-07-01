import { randomBytes } from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { execa } from "execa"
import {
  ANSIBLE_PLAYBOOK_TIMEOUT_MS,
  DOCKER_CONTAINER_WITH_ANSIBLE,
  DOCKER_IMAGE_WITH_ANSIBLE,
} from "../common/constants/index.js"

interface RunAnsiblePlaybookParams {
  ip: string
  login: string
  extraVars: Record<string, unknown>
}

const ANSIBLE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../ansible")
const { mountDir, playbooksDir, provisionServerPlaybookFile } = DOCKER_CONTAINER_WITH_ANSIBLE
const VARS_FILE = "/vars.json"

export async function runAnsiblePlaybook({ ip, login, extraVars }: RunAnsiblePlaybookParams) {
  const workDir = await mkdtemp(join(tmpdir(), "spurro-ansible-"))
  const varsPath = join(workDir, `${randomBytes(8).toString("hex")}.json`)
  await writeFile(varsPath, JSON.stringify(extraVars), { mode: 0o600 })

  try {
    await execa(
      "docker",
      [
        "run",
        "--rm",
        "-e",
        "ANSIBLE_HOST_KEY_CHECKING=false",
        "-v",
        `${ANSIBLE_DIR}:${mountDir}:ro`,
        "-v",
        `${varsPath}:${VARS_FILE}:ro`,
        DOCKER_IMAGE_WITH_ANSIBLE.name,
        "ansible-playbook",
        "-i",
        `${ip},`,
        "-u",
        login,
        "--extra-vars",
        `@${VARS_FILE}`,
        `${mountDir}/${playbooksDir}/${provisionServerPlaybookFile}`,
      ],
      { stdout: "inherit", stderr: "inherit", timeout: ANSIBLE_PLAYBOOK_TIMEOUT_MS },
    )
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}
