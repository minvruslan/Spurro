import { getTableName, sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { env } from "@/core/env/index.js"
import { TEST_DATABASE_URL } from "@tests/constants/TEST_DATABASE_URL.js"
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
  if (env.DATABASE_URL !== TEST_DATABASE_URL) {
    throw new Error(`Refusing to truncate a non-test database: ${env.DATABASE_URL}.`)
  }
  await db.execute(sql.raw(TRUNCATE_STATEMENT))
}
