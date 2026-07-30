import type { ProtocolFamilyCode } from "@spurro/shared"

export interface UpdateUserFormValues {
  name: string
  email: string
  limits: Record<ProtocolFamilyCode, number>
}
