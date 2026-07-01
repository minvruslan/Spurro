import { protocol, protocolType } from "../schemas/domainSchema.js"

export const protocolSelection = {
  id: protocol.id,
  version: protocol.version,
  typeId: protocolType.id,
  typeCode: protocolType.code,
  typeName: protocolType.name,
}
