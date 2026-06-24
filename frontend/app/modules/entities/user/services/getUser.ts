import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: UserSchema })

export async function getUser(id: string): Promise<User> {
  const api = useApi()
  const response = await api(`/api/users/${id}`)
  return ResponseSchema.parse(response).data
}
