import { oc, userAccess } from "../orpc"
import { z } from "zod"
import { ConfigLimitSchema } from "./ConfigLimitSchema"

export const ConfigLimitContract = oc.prefix("/config-limits").router({
  getUserConfigLimits: userAccess
    .route({ method: "GET", path: "/" })
    .output(z.array(ConfigLimitSchema)),
})
