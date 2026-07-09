import { sql } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { findReservedClientIPs } from "../queries/findReservedClientIPs.js"
import { pickFreeClientIP } from "../utils/pickFreeClientIP.js"

export async function allocateClientIPService(
  executor: DbOrTx,
  serverId: string,
  subnetPrefix: string,
): Promise<string | null> {
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${serverId}))`)
  const usedIPs = await findReservedClientIPs(executor, serverId)
  return pickFreeClientIP(usedIPs, subnetPrefix)
}
