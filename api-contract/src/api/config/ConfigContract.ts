import { oc, userAccess } from "../orpc"
import { z } from "zod"
import { ConfigSchema } from "./ConfigSchema"
import { DeleteUserConfigOutputSchema } from "./DeleteUserConfigOutputSchema"
import { UpsertConfigSchema } from "./UpsertConfigSchema"
import { UpdateConfigSchema } from "./UpdateConfigSchema"

export const ConfigContract = oc.prefix("/configs").router({
  getUserConfigs: userAccess.route({ method: "GET", path: "/" }).output(z.array(ConfigSchema)),
  getUserConfig: userAccess
    .route({ method: "GET", path: "/{id}" })
    .input(z.object({ id: z.uuid() }))
    .errors({
      NOT_FOUND: { message: "Config not found" },
    })
    .output(ConfigSchema),
  createUserConfig: userAccess
    .route({ method: "POST", path: "/", successStatus: 201 })
    .input(UpsertConfigSchema)
    .errors({
      FAILED: { status: 502, message: "Failed to create VPN config" },
      NO_AVAILABLE_IP: { status: 503, message: "Server is at capacity (no available IP)" },
      UNSUPPORTED_PROTOCOL: { status: 400, message: "Unsupported protocol" },
      LIMIT_REACHED: { status: 409, message: "Config limit reached for this protocol family" },
      ENDPOINT_INVALID: { status: 400, message: "Invalid endpoint" },
      DEVICE_TYPE_INVALID: { status: 400, message: "Invalid device type" },
    })
    .output(ConfigSchema),
  updateUserConfig: userAccess
    .route({ method: "PUT", path: "/{id}" })
    .input(UpdateConfigSchema.extend({ id: z.uuid() }))
    .errors({
      NOT_FOUND: { message: "Config not found" },
      DEVICE_TYPE_INVALID: { status: 400, message: "Invalid device type" },
    })
    .output(ConfigSchema),
  deleteUserConfig: userAccess
    .route({ method: "DELETE", path: "/{id}" })
    .input(z.object({ id: z.uuid() }))
    .errors({
      NOT_FOUND: { message: "Config not found" },
    })
    .output(DeleteUserConfigOutputSchema),
})
