export type ServiceFailure<ErrorCode extends string> = {
  ok: false
  errorCode: ErrorCode
  error?: unknown
}
