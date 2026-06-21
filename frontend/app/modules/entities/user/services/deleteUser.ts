import { useApi } from "@/modules/shared/services"

export async function deleteUser(id: string): Promise<void> {
  const api = useApi()
  await api(`/api/users/${id}`, { method: "DELETE" })
}
