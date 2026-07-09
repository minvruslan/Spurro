import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execa } from "execa"
import { DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER } from "../constants/index.js"

const imageDirectory = dirname(fileURLToPath(import.meta.url))

await execa(
  "docker",
  ["build", "-t", DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER.name, imageDirectory],
  { stdio: "inherit" },
)
