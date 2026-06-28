import { sql } from "drizzle-orm"
import { db } from "./db.js"

export async function checkDatabaseConnection() {
  await db.execute(sql`select 1`)
  console.log("[startup] database connection ok")
}
