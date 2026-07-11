import { sql } from "drizzle-orm"
import type { Amneziawg2ClientIdentifier } from "@spurro/shared"
import type { DbOrTx } from "@/core/database/index.js"
import { findReservedClientIdentifiers } from "../queries/findReservedClientIdentifiers.js"
import { pickFreeAmneziawg2ClientIP } from "../utils/pickFreeAmneziawg2ClientIP.js"

export async function allocateAmneziawg2ClientIPService(
  executor: DbOrTx,
  serverId: string,
  subnetPrefix: string,
): Promise<Amneziawg2ClientIdentifier | null> {
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${serverId}))`)
  const reservedClientIdentifiers = await findReservedClientIdentifiers(executor, serverId)
  return pickFreeAmneziawg2ClientIP(reservedClientIdentifiers, subnetPrefix)
}
