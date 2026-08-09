import { and, eq, gt, or, sql } from "drizzle-orm"
import { config } from "@/core/database/schemas/domainSchema.js"
import { PENDING_CONFIG_RESERVATION_MINUTES } from "../constants/PENDING_CONFIG_RESERVATION_MINUTES.js"

export function reservedConfigCondition() {
  return or(
    eq(config.status, "active"),
    and(
      eq(config.status, "pending"),
      gt(
        config.createdAt,
        sql`(now() at time zone 'utc') - make_interval(mins => ${PENDING_CONFIG_RESERVATION_MINUTES})`,
      ),
    ),
  )
}
