import type { ConfigProtocolOptions } from "@vancloak/api-contract"

export interface CreateConfigFormValues {
  name: string
  endpointId: string
  deviceTypeId: string
  protocolOptions: ConfigProtocolOptions | null
}
