import type { Config } from "@spurro/shared"
import type { ServiceResult } from "@/core/types/index.js"

export type CreateConfigResult = ServiceResult<
  { data: Config },
  | "endpoint_invalid"
  | "device_type_invalid"
  | "unsupported_protocol"
  | "no_available_ip"
  | "limit_reached"
  | "failed"
>
