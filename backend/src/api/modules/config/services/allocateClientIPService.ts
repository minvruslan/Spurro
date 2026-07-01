import { sql } from "drizzle-orm"
import type { DbOrTx } from "@/core/database/index.js"
import { findActiveClientIPs } from "../queries/findActiveClientIPs.js"
import { pickFreeClientIP } from "../utils/pickFreeClientIP.js"

export async function allocateClientIPService(
  executor: DbOrTx,
  serverId: string,
): Promise<string | null> {
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${serverId}))`)
  const usedIPs = await findActiveClientIPs(executor, serverId)
  return pickFreeClientIP(usedIPs)
}
