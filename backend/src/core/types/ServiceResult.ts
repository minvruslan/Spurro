import type { ServiceFailure } from "./ServiceFailure.js"

export type ServiceResult<Success, Reason extends string> =
  | ({ ok: true } & Success)
  | ServiceFailure<Reason>
