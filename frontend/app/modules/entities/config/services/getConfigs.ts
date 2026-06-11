import type { Config } from "@spurro/shared"
// import { ConfigSchema } from "@spurro/shared"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(ConfigSchema) })

const MOCK_CONFIGS: Config[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "iPhone",
    deviceType: { id: "d0000000-0000-4000-8000-000000000001", code: "ios", name: "iOS" },
    endpoint: {
      id: "e0000000-0000-4000-8000-000000000001",
      port: 8443,
      protocol: {
        id: "b0000000-0000-4000-8000-000000000001",
        version: "2.0",
        type: { id: "c0000000-0000-4000-8000-000000000001", code: "amnezia", name: "Amnezia" },
      },
      server: { id: "f0000000-0000-4000-8000-000000000001", name: "Germany #1", country: "DE" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    name: "MacBook",
    deviceType: { id: "d0000000-0000-4000-8000-000000000002", code: "macos", name: "macOS" },
    endpoint: {
      id: "e0000000-0000-4000-8000-000000000002",
      port: 8443,
      protocol: {
        id: "b0000000-0000-4000-8000-000000000001",
        version: "2.0",
        type: { id: "c0000000-0000-4000-8000-000000000001", code: "amnezia", name: "Amnezia" },
      },
      server: { id: "f0000000-0000-4000-8000-000000000001", name: "Germany #1", country: "DE" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    name: "Android",
    deviceType: { id: "d0000000-0000-4000-8000-000000000003", code: "android", name: "Android" },
    endpoint: {
      id: "e0000000-0000-4000-8000-000000000003",
      port: 443,
      protocol: {
        id: "b0000000-0000-4000-8000-000000000002",
        version: "1.0",
        type: { id: "c0000000-0000-4000-8000-000000000002", code: "mtproto", name: "MTProto" },
      },
      server: { id: "f0000000-0000-4000-8000-000000000002", name: "Netherlands #1", country: "NL" },
    },
    config: {},
    status: "active",
    createdAt: "2026-06-03T10:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
  },
]

export async function getConfigs(): Promise<Config[]> {
  // const api = useApi()
  // const response = await api("/api/configs")
  // return ResponseSchema.parse(response).data
  return MOCK_CONFIGS
}
