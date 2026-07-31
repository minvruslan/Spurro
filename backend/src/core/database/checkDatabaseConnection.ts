import { startupLogger } from "@/core/logger/index.js"
import { sql } from "drizzle-orm"
import { db } from "./db.js"

export async function checkDatabaseConnection() {
  await db.execute(sql`select 1`)
  startupLogger.info("Database connection ok.")
}
