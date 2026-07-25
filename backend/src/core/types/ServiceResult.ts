import type { ServiceFailure } from "./ServiceFailure.js"

export type ServiceResult<Data extends object | null, Reason extends string = never> =
  | { ok: true; data: Data }
  | ([Reason] extends [never] ? never : ServiceFailure<Reason>)
