import { Redis } from "ioredis"
import { queueConnection } from "./queueConnection.js"

export async function checkQueueConnection() {
  const client = new Redis({
    ...queueConnection,
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  })

  client.on("error", () => {})

  try {
    await client.connect()
    await client.ping()
    console.log("[startup] queue connection ok")
  } finally {
    client.disconnect()
  }
}
