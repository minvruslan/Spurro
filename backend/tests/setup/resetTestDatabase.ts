import { getTableName, sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import {
  account,
  config,
  configLimit,
  deviceType,
  endpoint,
  protocol,
  server,
  session,
  user,
  verification,
} from "@/core/database/schemas/index.js"

const TABLES_TO_RESET = [
  account,
  config,
  configLimit,
  deviceType,
  endpoint,
  protocol,
  server,
  session,
  user,
  verification,
]

const TRUNCATE_STATEMENT = `truncate table ${TABLES_TO_RESET.map(
  (table) => `"${getTableName(table)}"`,
).join(", ")} cascade`

export async function resetTestDatabase() {
  await db.execute(sql.raw(TRUNCATE_STATEMENT))
}
