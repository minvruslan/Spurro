import { useApi } from "@/modules/common/services"

export async function deleteServer(id: string): Promise<void> {
  const api = useApi()
  await api(`/api/servers/${id}`, { method: "DELETE" })
}
