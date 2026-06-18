import { serve } from "@hono/node-server"
import app from "./app.js"
import {
  bootstrapAdmin,
  bootstrapDeviceTypes,
  bootstrapProtocols,
  bootstrapCurrentServer,
} from "./core/bootstraps/index.js"

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? "localhost"

await bootstrapAdmin()
await bootstrapDeviceTypes()
await bootstrapProtocols()
await bootstrapCurrentServer()

const server = serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Server running on http://${host}:${port}`)
})

const shutdown = () => {
  server.close()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
