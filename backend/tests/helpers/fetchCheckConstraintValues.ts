import { sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"

export async function fetchCheckConstraintValues(constraintName: string) {
  const constraintRows = await db.execute(sql`
    select pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conname = ${constraintName}
  `)
  const [constraintRow] = constraintRows
  if (!constraintRow) throw new Error(`Check constraint ${constraintName} not found.`)
  const definition = constraintRow.definition as string
  return [...definition.matchAll(/'([^']*)'/g)].map((match) => match[1])
}
