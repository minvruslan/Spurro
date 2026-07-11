import type { SupportedProtocolCode } from "./SupportedProtocolCode"
import type { ConfigDataByProtocol } from "./ConfigDataByProtocol"

export type ConfigData = ConfigDataByProtocol[SupportedProtocolCode]
