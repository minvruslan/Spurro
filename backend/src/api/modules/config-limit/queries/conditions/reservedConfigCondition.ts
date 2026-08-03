import { and, eq, gt, or, sql } from "drizzle-orm"
import { config } from "@/core/database/schemas/domainSchema.js"

const PENDING_CONFIG_RESERVATION_MINUTES = 6

export function reservedConfigCondition() {
  return or(
    eq(config.status, "active"),
    and(
      eq(config.status, "pending"),
      gt(
        config.createdAt,
        sql`now() - make_interval(mins => ${PENDING_CONFIG_RESERVATION_MINUTES})`,
      ),
    ),
  )
}
