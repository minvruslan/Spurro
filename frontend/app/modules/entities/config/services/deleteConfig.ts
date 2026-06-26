import { useApi } from "@/modules/common/services"

export async function deleteConfig(id: string): Promise<void> {
  const api = useApi()
  await api(`/api/configs/${id}`, { method: "DELETE" })
}
