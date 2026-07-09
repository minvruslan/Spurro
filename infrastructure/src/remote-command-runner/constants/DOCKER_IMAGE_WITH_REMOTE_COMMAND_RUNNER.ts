import { PROJECT_NAME } from "./PROJECT_NAME.js"

export const DOCKER_IMAGE_WITH_REMOTE_COMMAND_RUNNER = {
  version: "1",
  get name() {
    return `${PROJECT_NAME}/remote-command-runner:${this.version}`
  },
}
