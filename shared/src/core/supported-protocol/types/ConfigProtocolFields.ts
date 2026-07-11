import type { SupportedProtocolCode } from "./SupportedProtocolCode"
import type { ConfigDataByProtocol } from "./ConfigDataByProtocol"
import type { ClientIdentifierByProtocol } from "./ClientIdentifierByProtocol"

export type ConfigProtocolFields = {
  [Code in SupportedProtocolCode]: {
    data: ConfigDataByProtocol[Code]
    clientIdentifier: ClientIdentifierByProtocol[Code]
  }
}[SupportedProtocolCode]
