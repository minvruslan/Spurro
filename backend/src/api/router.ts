import { authorized } from "@/api/orpc/index.js"
import { deviceTypeRouter } from "@/api/modules/device-type/index.js"
import { protocolRouter } from "@/api/modules/protocol/index.js"
import { configLimitRouter } from "@/api/modules/config-limit/index.js"
import { userRouter } from "@/api/modules/user/index.js"
import { serverRouter } from "@/api/modules/server/index.js"
import { endpointRouter } from "@/api/modules/endpoint/index.js"
import { configRouter } from "@/api/modules/config/index.js"

const router = authorized.router({
  configs: configRouter,
  deviceTypes: deviceTypeRouter,
  protocols: protocolRouter,
  configLimits: configLimitRouter,
  users: userRouter,
  servers: serverRouter,
  endpoints: endpointRouter,
})

export { router }
