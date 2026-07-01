import type { Config } from "@spurro/shared"

export type CreateConfigResult =
  | { ok: true; data: Config }
  | {
      ok: false
      reason:
        | "endpoint_invalid"
        | "device_type_invalid"
        | "unsupported_protocol"
        | "no_available_ip"
        | "failed"
    }
