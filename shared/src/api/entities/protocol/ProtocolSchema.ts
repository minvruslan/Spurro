import { z } from "zod"
import {
  ProtocolCodeSchema,
  ProtocolFamilyCodeSchema,
} from "../../../core/supported-protocol/types"

export const ProtocolSchema = z.object({
  id: z.uuid(),
  code: ProtocolCodeSchema,
  family: ProtocolFamilyCodeSchema,
  name: z.string(),
})
