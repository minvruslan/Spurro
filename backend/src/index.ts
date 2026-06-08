import { serve } from "@hono/node-server"
import app from "./app.js"
import { bootstrapAdmin } from "./core/bootstraps/index.js"

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? "localhost"

await bootstrapAdmin()

const server = serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Server running on http://${host}:${port}`)
})

const shutdown = () => {
  server.close()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
