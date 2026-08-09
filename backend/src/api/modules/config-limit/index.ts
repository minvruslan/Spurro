import { getUserConfigLimitsRoute } from "./routes/getUserConfigLimitsRoute.js"

const configLimitRouter = {
  getUserConfigLimits: getUserConfigLimitsRoute,
}

export { configLimitRouter }
export { getUserConfigLimitsService } from "./services/getUserConfigLimitsService.js"
export { getUsersConfigLimitsService } from "./services/getUsersConfigLimitsService.js"
export { setUserConfigLimitsService } from "./services/setUserConfigLimitsService.js"
export { isUserConfigLimitReachedService } from "./services/isUserConfigLimitReachedService.js"
export { reservedConfigCondition } from "./queries/conditions/reservedConfigCondition.js"
