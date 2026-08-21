import type { ProtocolFamilyCode } from "@vancloak/api-contract"

export interface UpdateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
