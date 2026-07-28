import type { ServiceFailure } from "./ServiceFailure.js"

export type ServiceResult<Data extends object | null, ErrorCode extends string = never> =
  | { ok: true; data: Data }
  | ([ErrorCode] extends [never] ? never : ServiceFailure<ErrorCode>)
