import { oc, adminAccess } from "../orpc"
import { z } from "zod"
import { ProtocolSchema } from "./ProtocolSchema"

export const ProtocolContract = oc.prefix("/protocols").router({
  getProtocols: adminAccess.route({ method: "GET", path: "/" }).output(z.array(ProtocolSchema)),
})
