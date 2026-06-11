import type { ConfigLimit } from "@spurro/shared"
// import { ConfigLimitSchema } from "@spurro/shared"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(ConfigLimitSchema) })

const MOCK_CONFIG_LIMITS: ConfigLimit[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    protocolType: { id: "c0000000-0000-4000-8000-000000000002", code: "mtproto", name: "MTProto" },
    maxCount: 5,
    used: 3,
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    protocolType: { id: "c0000000-0000-4000-8000-000000000001", code: "amnezia", name: "Amnezia" },
    maxCount: 5,
    used: 2,
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
]

export async function getConfigLimits(): Promise<ConfigLimit[]> {
  // const api = useApi()
  // const response = await api("/api/configs/limits")
  // return ResponseSchema.parse(response).data
  return MOCK_CONFIG_LIMITS
}
