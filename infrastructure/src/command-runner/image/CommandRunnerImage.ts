import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PROJECT_NAME } from "../../common/constants/index.js"

const DOCKERFILE_PATH = join(dirname(fileURLToPath(import.meta.url)), "Dockerfile")
const contentHash = createHash("sha256")
  .update(readFileSync(DOCKERFILE_PATH))
  .digest("hex")
  .slice(0, 12)

export const CommandRunnerImage = {
  name: `${PROJECT_NAME}/command-runner:${contentHash}`,
}
