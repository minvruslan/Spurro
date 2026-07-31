import type { ProtocolFamilyCode } from "@spurro/shared"

export interface CreateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
