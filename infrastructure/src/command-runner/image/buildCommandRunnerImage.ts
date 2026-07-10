import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execa } from "execa"
import { CommandRunnerImage } from "./CommandRunnerImage.js"

const imageDirectory = dirname(fileURLToPath(import.meta.url))

await execa("docker", ["build", "-t", CommandRunnerImage.name, imageDirectory], {
  stdio: "inherit",
})
