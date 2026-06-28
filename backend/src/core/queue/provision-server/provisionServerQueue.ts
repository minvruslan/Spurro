import { Queue } from "bullmq"
import { queueConnection } from "../queueConnection.js"
import { PROVISION_SERVER_QUEUE_NAME } from "./constants/index.js"
import type { ProvisionServerJob } from "./types/index.js"

let instance: Queue<ProvisionServerJob> | null = null

export function provisionServerQueue(): Queue<ProvisionServerJob> {
  return (instance ??= new Queue<ProvisionServerJob>(PROVISION_SERVER_QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: { age: 60 * 60 * 24 * 7, count: 10 },
    },
  }))
}
