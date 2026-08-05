import { checkDatabaseConnection } from "@/core/database/checkDatabaseConnection.js"
import { workerLogger } from "@/core/logger/index.js"
import { checkQueueConnection } from "@/core/queue/index.js"
import { createProvisioningWorker } from "./createProvisioningWorker.js"

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

const worker = createProvisioningWorker()

workerLogger.info("Provisioning worker started.")

const shutdown = async () => {
  await worker.close()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
