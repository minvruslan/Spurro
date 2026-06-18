type FormattedError = { status: 400 | 409; message: string }

export function formatDatabaseError(error: unknown): FormattedError | null {
  if (typeof error !== "object" || error === null) return null
  const code = (error as { code?: string }).code
  if (code === "23505") return { status: 409, message: "Duplicate port for this server" }
  if (code === "23503") return { status: 400, message: "Unknown protocol" }
  return null
}
