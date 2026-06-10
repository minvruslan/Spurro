import type { Config } from "@spurro/shared"
// TODO: вернуть для реального запроса, когда уберём мок.
// import { ConfigSchema } from "@spurro/shared"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(ConfigSchema) })

// TODO: временная заглушка для проверки UI без бэкенда — вернуть реальный запрос ниже.
const MOCK_CONFIGS: Config[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "iPhone",
    deviceType: { id: "d0000000-0000-0000-0000-000000000001", code: "ios", name: "iOS" },
    endpoint: {
      id: "e0000000-0000-0000-0000-000000000001",
      port: 443,
      protocol: {
        id: "p0000000-0000-0000-0000-000000000001",
        version: "1.0",
        type: { id: "t0000000-0000-0000-0000-000000000001", code: "mtproto", name: "MTProto" },
      },
      server: { id: "s0000000-0000-0000-0000-000000000001", name: "fra-1", country: "DE" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "MacBook",
    deviceType: { id: "d0000000-0000-0000-0000-000000000002", code: "macos", name: "macOS" },
    endpoint: {
      id: "e0000000-0000-0000-0000-000000000002",
      port: 8443,
      protocol: {
        id: "p0000000-0000-0000-0000-000000000002",
        version: "2.0",
        type: { id: "t0000000-0000-0000-0000-000000000002", code: "amnezia", name: "Amnezia" },
      },
      server: { id: "s0000000-0000-0000-0000-000000000002", name: "ams-1", country: "NL" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Рабочий ноут с очень длинным именем",
    deviceType: { id: "d0000000-0000-0000-0000-000000000003", code: "windows", name: "Windows" },
    endpoint: {
      id: "e0000000-0000-0000-0000-000000000003",
      port: 51820,
      protocol: {
        id: "p0000000-0000-0000-0000-000000000003",
        version: "1.0",
        type: { id: "t0000000-0000-0000-0000-000000000001", code: "mtproto", name: "MTProto" },
      },
      server: { id: "s0000000-0000-0000-0000-000000000003", name: "waw-1", country: "PL" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-03T10:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
  },
]

export async function getConfigs(): Promise<Config[]> {
  // TODO: ВРЕМЕННО — задержка для отладки UI/анимации. Убрать вместе с моком.
  await new Promise((resolve) => setTimeout(resolve, 300))
  // TODO: вернуть реальный запрос, убрать мок.
  return MOCK_CONFIGS
  // const api = useApi()
  // const response = await api("/api/configs")
  // return ResponseSchema.parse(response).data
}
