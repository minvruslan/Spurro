import type { ProtocolFamilyCode } from "@spurro/api-contract"

export interface UpdateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
