import type { ValidationTargets } from "hono"
import { zValidator } from "@hono/zod-validator"
import type { ZodType } from "zod"
import { apiLogger } from "@/core/logger/index.js"

export function requestValidator<Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      }))
      apiLogger.warn({ method: c.req.method, path: c.req.path, issues }, "Validation failed.")
      return c.json({ error: "Validation failed", issues }, 400)
    }
  })
}
