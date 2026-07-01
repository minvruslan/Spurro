import type { ServerStatus } from "@spurro/shared"

interface ServerStatusStyle {
  dot: string
  text: string
  rail: string
}

const serverStatusStyleMap: Record<ServerStatus, ServerStatusStyle> = {
  active: { dot: "bg-emerald-500", text: "text-foreground", rail: "bg-emerald-500" },
  provisioning: { dot: "bg-primary", text: "text-foreground", rail: "bg-primary" },
  failed: { dot: "bg-destructive", text: "text-foreground", rail: "bg-destructive" },
  deleted: { dot: "bg-zinc-400", text: "text-muted-foreground", rail: "bg-zinc-300" },
}

export const getServerStatusStyle = (status: ServerStatus): ServerStatusStyle =>
  serverStatusStyleMap[status]
