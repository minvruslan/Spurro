import { env } from "@/core/env/index.js"

const url = new URL(env.QUEUE_URL)

export const queueConnection = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  username: url.username ? decodeURIComponent(url.username) : undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined,
  db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
  tls: url.protocol === "rediss:" ? {} : undefined,
}
