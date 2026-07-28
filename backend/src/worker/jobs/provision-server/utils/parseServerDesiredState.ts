import type { ZodError } from "zod"
import { ServerDesiredStateSchema } from "@spurro/infrastructure/types"
import type { ServerData, ServerDesiredState } from "@spurro/infrastructure/types"

type ParseServerDesiredStateResult =
  | { status: "found"; desiredState: ServerDesiredState }
  | { status: "missing" }
  | { status: "invalid"; error: ZodError }

export function parseServerDesiredState(serverData: ServerData): ParseServerDesiredStateResult {
  const parsed = ServerDesiredStateSchema.safeParse(serverData.desiredState)
  if (parsed.success) return { status: "found", desiredState: parsed.data }
  if (serverData.desiredState === undefined) return { status: "missing" }
  return { status: "invalid", error: parsed.error }
}
