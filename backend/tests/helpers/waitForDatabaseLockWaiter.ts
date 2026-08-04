import { sql } from "drizzle-orm"
import { db } from "@/core/database/index.js"

export async function waitForDatabaseLockWaiter(pending: Promise<unknown>) {
  let pendingSettled = false
  function markPendingSettled() {
    pendingSettled = true
  }
  void pending.then(markPendingSettled, markPendingSettled)

  while (!pendingSettled) {
    const rows = await db.execute(
      sql`select count(*)::int as waiter_count from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'`,
    )
    if (Number(rows[0]?.waiter_count) > 0) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}
