import { Worker } from "bullmq"
import { checkDatabaseConnection } from "@/core/database/checkDatabaseConnection.js"
import { checkQueueConnection, queueConnection } from "@/core/queue/index.js"
import {
  PROVISION_SERVER_QUEUE_NAME,
  type ProvisionServerJob,
} from "@/core/queue/provision-server/index.js"
import { provisionServerJob } from "./jobs/provision-server/provisionServerJob.js"
import { updateServerStatus } from "./jobs/provision-server/queries/updateServerStatus.js"

try {
  await checkDatabaseConnection()
  await checkQueueConnection()
} catch (error) {
  console.error(
    "[worker] dependency check failed — is Postgres/Redis running? (docker compose up -d)",
    error,
  )
  process.exit(1)
}

const worker = new Worker<ProvisionServerJob>(
  PROVISION_SERVER_QUEUE_NAME,
  (job) => provisionServerJob(job.data),
  { connection: queueConnection, concurrency: 5 },
)

worker.on("failed", async (job, err) => {
  console.error(`[worker] job ${job?.id} failed`, err)
  if (!job) return

  const attemptsLeft = (job.opts.attempts ?? 1) - job.attemptsMade
  if (attemptsLeft <= 0) {
    await updateServerStatus(job.data.serverId, "failed").catch((statusError) =>
      console.error(`[worker] failed to mark server ${job.data.serverId} as failed`, statusError),
    )
  }
})

worker.on("error", (err) => {
  console.error("[worker] error", err)
})

console.log("[worker] provisioning worker started")

const shutdown = async () => {
  await worker.close()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
