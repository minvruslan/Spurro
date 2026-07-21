import { UnrecoverableError, Worker } from "bullmq"
import { checkDatabaseConnection } from "@/core/database/checkDatabaseConnection.js"
import { workerLogger } from "@/core/logger/index.js"
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
  workerLogger.error(
    { error },
    "Dependency check failed — is Postgres/Redis running? (docker compose up -d).",
  )
  process.exit(1)
}

const worker = new Worker<ProvisionServerJob>(
  PROVISION_SERVER_QUEUE_NAME,
  (job) => provisionServerJob(job.data),
  { connection: queueConnection, concurrency: 5 },
)

worker.on("failed", async (job, err) => {
  workerLogger.error({ error: err, jobId: job?.id }, "Job failed.")
  if (!job) return

  const attemptsLeft = (job.opts.attempts ?? 1) - job.attemptsMade
  if (attemptsLeft <= 0 || err instanceof UnrecoverableError) {
    await updateServerStatus(job.data.serverId, "failed").catch((statusError) =>
      workerLogger.error(
        { error: statusError, serverId: job.data.serverId },
        "Failed to mark server as failed.",
      ),
    )
  }
})

worker.on("error", (err) => {
  workerLogger.error({ error: err }, "Worker error.")
})

workerLogger.info("Provisioning worker started.")

const shutdown = async () => {
  await worker.close()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
