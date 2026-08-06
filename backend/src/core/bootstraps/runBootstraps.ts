import { sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"
import { bootstrapAdmin } from "./bootstrapAdmin.js"
import { bootstrapDeviceTypes } from "./bootstrapDeviceTypes.js"
import { bootstrapProtocols } from "./bootstrapProtocols.js"
import { bootstrapCurrentServer } from "./bootstrapCurrentServer.js"

export async function runBootstraps() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('bootstraps'))`)
    await bootstrapAdmin()
    await bootstrapDeviceTypes()
    await bootstrapProtocols()
    await bootstrapCurrentServer()
  })
}
