import type { User } from "@spurro/shared"
import { UserSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(UserSchema) })

export async function getUsers(): Promise<User[]> {
  const api = useApi()
  const response = await api("/api/users")
  return ResponseSchema.parse(response).data
}
