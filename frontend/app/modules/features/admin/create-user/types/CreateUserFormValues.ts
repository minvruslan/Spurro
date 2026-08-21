import type { ProtocolFamilyCode } from "@vancloak/api-contract"

export interface CreateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
