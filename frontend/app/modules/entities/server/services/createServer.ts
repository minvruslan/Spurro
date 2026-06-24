import type { Server, UpsertServer } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: ServerSchema })

export async function createServer(payload: UpsertServer): Promise<Server> {
  const api = useApi()
  const response = await api("/api/servers", {
    method: "POST",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}
