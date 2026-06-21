import type { User, UpsertUser } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/shared/services"

const ResponseSchema = z.object({ data: UserSchema })

export async function updateUser(id: string, payload: UpsertUser): Promise<User> {
  const api = useApi()
  const response = await api(`/api/users/${id}`, {
    method: "PUT",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}
