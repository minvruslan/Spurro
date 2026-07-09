import type { SupportedProtocolFamily } from "@spurro/shared"

export interface CreateUserFormValues {
  name: string
  email: string
  limits: Record<SupportedProtocolFamily, number>
}
