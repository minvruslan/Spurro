import { afterEach, describe, expect, it, vi } from "vitest"

async function importQueueConnection(queueUrl: string) {
  vi.stubEnv("QUEUE_URL", queueUrl)
  vi.resetModules()
  const { queueConnection } = await import("@/core/queue/queueConnection.js")
  return queueConnection
}

describe("queueConnection", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("reads the host and port from QUEUE_URL", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6380")

    expect(queueConnection.host).toBe("redis.internal")
    expect(queueConnection.port).toBe(6380)
  })

  it("falls back to port 6379 when the url carries no port", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal")

    expect(queueConnection.port).toBe(6379)
  })

  it("leaves credentials undefined when the url carries none", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6379")

    expect(queueConnection.username).toBeUndefined()
    expect(queueConnection.password).toBeUndefined()
  })

  it("decodes percent-encoded credentials", async () => {
    const queueConnection = await importQueueConnection(
      "redis://user%40spurro:p%40ss%3Aword@redis.internal:6379",
    )

    expect(queueConnection.username).toBe("user@spurro")
    expect(queueConnection.password).toBe("p@ss:word")
  })

  it("leaves the database index undefined when the url has no path", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6379")

    expect(queueConnection.db).toBeUndefined()
  })

  it("leaves the database index undefined for a root path", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6379/")

    expect(queueConnection.db).toBeUndefined()
  })

  it("reads the database index from the url path", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6379/2")

    expect(queueConnection.db).toBe(2)
  })

  it("enables tls for a rediss url", async () => {
    const queueConnection = await importQueueConnection("rediss://redis.internal:6380")

    expect(queueConnection.tls).toEqual({})
  })

  it("leaves tls undefined for a plain redis url", async () => {
    const queueConnection = await importQueueConnection("redis://redis.internal:6379")

    expect(queueConnection.tls).toBeUndefined()
  })
})
