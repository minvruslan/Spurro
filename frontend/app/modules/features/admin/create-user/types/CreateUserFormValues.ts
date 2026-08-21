import type { ProtocolFamilyCode } from "@spurro/api-contract"

export interface CreateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
