export type ServiceFailure<Reason extends string> = {
  ok: false
  reason: Reason
  error?: unknown
}
