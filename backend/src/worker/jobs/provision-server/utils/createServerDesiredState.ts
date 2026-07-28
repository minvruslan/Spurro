import { ServerDesiredStateSchema } from "@spurro/infrastructure/types"
import type { ServerDesiredState } from "@spurro/infrastructure/types"
import {
  VPN_NODE_BASE_DIRECTORY,
  VPN_NODE_DNS,
  VPN_NODE_SSH_PORT,
  VPN_NODE_USERNAME,
} from "../constants/index.js"

export function createServerDesiredState(): ServerDesiredState {
  return ServerDesiredStateSchema.parse({
    ssh: {
      type: "privateKey",
      username: VPN_NODE_USERNAME,
      port: VPN_NODE_SSH_PORT,
    },
    dns: VPN_NODE_DNS,
    baseDirectory: VPN_NODE_BASE_DIRECTORY,
  })
}
