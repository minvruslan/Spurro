import type { ServerContract } from "./ServerContract"
import type { ServerState } from "./ServerState"

export type ServerData = {
  contract?: ServerContract
  state: ServerState
}
