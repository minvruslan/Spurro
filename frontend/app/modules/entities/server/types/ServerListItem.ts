export type ServerStatus = "active" | "inactive" | "maintenance"

export interface ServerListItem {
  id: string
  name: string
  hostname: string
  ip: string | null
  country: string
  status: ServerStatus
  protocols: string[]
}
