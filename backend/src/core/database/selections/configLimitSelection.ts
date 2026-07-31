import { configLimit } from "../schemas/domainSchema.js"

export const configLimitSelection = {
  id: configLimit.id,
  userId: configLimit.userId,
  protocolFamily: configLimit.protocolFamily,
  maxCount: configLimit.maxCount,
  createdAt: configLimit.createdAt,
  updatedAt: configLimit.updatedAt,
}
