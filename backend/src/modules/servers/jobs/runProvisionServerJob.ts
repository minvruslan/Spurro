import { db } from "@/core/database/index.js"
import { updateServerStatus } from "../repository/updateServerStatus.js"

export async function runProvisionServerJob(serverId: string) {
  await new Promise((resolve) => setTimeout(resolve, 5000))
  await updateServerStatus(db, serverId, "active")
}
