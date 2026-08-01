import { ConfigContract } from "./config/ConfigContract"
import { ConfigLimitContract } from "./config-limit/ConfigLimitContract"
import { DeviceTypeContract } from "./device-type/DeviceTypeContract"
import { EndpointContract } from "./endpoint/EndpointContract"
import { ProtocolContract } from "./protocol/ProtocolContract"
import { ServerContract } from "./server/ServerContract"
import { UserContract } from "./user/UserContract"

export const ApiContract = {
  configs: ConfigContract,
  configLimits: ConfigLimitContract,
  deviceTypes: DeviceTypeContract,
  endpoints: EndpointContract,
  protocols: ProtocolContract,
  servers: ServerContract,
  users: UserContract,
}
