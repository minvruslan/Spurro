import type { ConfigLimit } from "@spurro/shared"
// TODO: вернуть для реального запроса, когда уберём мок.
// import { ConfigLimitSchema } from "@spurro/shared"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(ConfigLimitSchema) })

// TODO: временная заглушка для проверки UI без бэкенда — вернуть реальный запрос ниже.
const MOCK_CONFIG_LIMITS: ConfigLimit[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    protocolType: { id: "t0000000-0000-0000-0000-000000000001", code: "mtproto", name: "MTProto" },
    maxCount: 3,
    used: 2,
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    protocolType: { id: "t0000000-0000-0000-0000-000000000002", code: "amnezia", name: "Amnezia" },
    maxCount: 3,
    used: 1,
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
  },
]

export async function getConfigLimits(): Promise<ConfigLimit[]> {
  // TODO: вернуть реальный запрос, убрать мок.
  return Promise.resolve(MOCK_CONFIG_LIMITS)
  // const api = useApi()
  // const response = await api("/api/configs/limits")
  // return ResponseSchema.parse(response).data
}
