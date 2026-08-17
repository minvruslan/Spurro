import type { ConfigProtocolOptions } from "@spurro/api-contract"

export interface CreateConfigFormValues {
  name: string
  endpointId: string
  deviceTypeId: string
  protocolOptions: ConfigProtocolOptions | null
}
