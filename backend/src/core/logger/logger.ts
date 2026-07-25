import { pino, stdSerializers } from "pino"

const REDACTED_PATHS = [
  "clientConfiguration",
  "*.clientConfiguration",
  "privateKey",
  "*.privateKey",
  "presharedKey",
  "*.presharedKey",
  "publicKey",
  "*.publicKey",
  "password",
  "*.password",
  "serverAccess",
  "*.serverAccess",
]

export const logger = pino({
  redact: REDACTED_PATHS,
  serializers: { error: stdSerializers.err },
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
})

export const apiLogger = logger.child({ module: "api" })
export const authLogger = logger.child({ module: "auth" })
export const bootstrapLogger = logger.child({ module: "bootstrap" })
export const configLogger = logger.child({ module: "config" })
export const serverLogger = logger.child({ module: "server" })
export const startupLogger = logger.child({ module: "startup" })
export const userLogger = logger.child({ module: "user" })
export const workerLogger = logger.child({ module: "worker" })
