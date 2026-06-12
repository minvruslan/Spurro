import type { ServerListItem } from "../types/ServerListItem"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(ServerListItemSchema) })

const MOCK_SERVERS: ServerListItem[] = [
  {
    id: "f0000000-0000-4000-8000-000000000001",
    name: "Germany #1",
    hostname: "de1.spurro.net",
    ip: "203.0.113.10",
    country: "Germany",
    status: "active",
    protocols: ["Amnezia", "MTProto"],
  },
  {
    id: "f0000000-0000-4000-8000-000000000002",
    name: "Netherlands #1",
    hostname: "nl1.spurro.net",
    ip: "203.0.113.20",
    country: "Netherlands",
    status: "active",
    protocols: ["VLESS"],
  },
  {
    id: "f0000000-0000-4000-8000-000000000003",
    name: "Netherlands #2",
    hostname: "nl2.spurro.net",
    ip: null,
    country: "Netherlands",
    status: "maintenance",
    protocols: ["Amnezia", "VLESS", "MTProto"],
  },
]

export async function getServers(): Promise<ServerListItem[]> {
  // const api = useApi()
  // const response = await api("/api/servers")
  // return ResponseSchema.parse(response).data
  return MOCK_SERVERS
}
