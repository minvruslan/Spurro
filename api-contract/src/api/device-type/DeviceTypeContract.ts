import { oc, userAccess } from "../orpc"
import { z } from "zod"
import { DeviceTypeSchema } from "./DeviceTypeSchema"

export const DeviceTypeContract = oc.prefix("/device-types").router({
  getDeviceTypes: userAccess.route({ method: "GET", path: "/" }).output(z.array(DeviceTypeSchema)),
})
