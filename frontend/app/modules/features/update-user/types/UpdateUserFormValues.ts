import type { SupportedProtocolFamily } from "@spurro/shared"

export interface UpdateUserFormValues {
  name: string
  email: string
  limits: Record<SupportedProtocolFamily, number>
}
