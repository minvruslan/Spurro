import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: UserSchema })

export async function createUser(payload: UpsertUser): Promise<User> {
  const api = useApi()
  const response = await api("/api/users", {
    method: "POST",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}
