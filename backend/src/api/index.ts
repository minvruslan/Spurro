import { serve } from "@hono/node-server"
import app from "./app.js"
import {
  bootstrapAdmin,
  bootstrapDeviceTypes,
  bootstrapProtocols,
  bootstrapCurrentServer,
} from "@/core/bootstraps/index.js"
import { checkDatabaseConnection } from "@/core/database/checkDatabaseConnection.js"
import { env } from "@/core/env/index.js"
import { checkQueueConnection } from "@/core/queue/index.js"
import { provisionServerQueue } from "@/core/queue/provision-server/index.js"

const port = env.PORT
const host = env.HOST

try {
  await checkDatabaseConnection()
  await checkQueueConnection()
} catch (error) {
  console.error(
    "[startup] dependency check failed — is Postgres/Redis running? (docker compose up -d)",
    error,
  )
  process.exit(1)
}

await bootstrapAdmin()
await bootstrapDeviceTypes()
await bootstrapProtocols()
await bootstrapCurrentServer()

const server = serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Server running on http://${host}:${port}`)
})

const shutdown = async () => {
  await provisionServerQueue().close()
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  )
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
