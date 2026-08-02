import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { TEST_DATABASE_URL } from "../constants/TEST_DATABASE_URL.js"

export default async function prepareTestDatabase() {
  const connection = postgres(TEST_DATABASE_URL, { max: 1 })
  try {
    await migrate(drizzle(connection), { migrationsFolder: "./drizzle" })
    const tables = await connection<
      { tablename: string }[]
    >`select tablename from pg_tables where schemaname = 'public'`
    if (tables.length > 0) {
      const quotedTableNames = tables.map((table) => `"${table.tablename}"`).join(", ")
      await connection.unsafe(`truncate table ${quotedTableNames} cascade`)
    }
  } finally {
    await connection.end()
  }
}
