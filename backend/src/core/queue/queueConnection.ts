import { env } from "@/core/env/index.js"

const url = new URL(env.QUEUE_URL)

if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
  throw new Error("QUEUE_URL must use the redis:// or rediss:// scheme")
}

const databaseIndex = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined

if (databaseIndex !== undefined && Number.isNaN(databaseIndex)) {
  throw new Error("QUEUE_URL path must be a numeric database index")
}

export const queueConnection = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  username: url.username ? decodeURIComponent(url.username) : undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined,
  db: databaseIndex,
  tls: url.protocol === "rediss:" ? {} : undefined,
}
