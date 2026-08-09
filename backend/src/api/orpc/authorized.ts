import { ORPCError } from "@orpc/server"
import { authServer } from "@/core/auth-server/index.js"
import { os } from "./os.js"

const authorizedMiddleware = os.middleware(async ({ context, procedure, next }) => {
  const session = await authServer.api.getSession({ headers: context.headers })

  if (!session) throw new ORPCError("UNAUTHORIZED")
  const banIsActive =
    session.user.banned === true &&
    (session.user.banExpires == null || session.user.banExpires > new Date())

  if (banIsActive) throw new ORPCError("UNAUTHORIZED")

  if (procedure["~orpc"].meta.access === "admin" && session.user.role !== "admin") {
    throw new ORPCError("FORBIDDEN")
  }

  return next({ context: { userId: session.user.id } })
})

const authorized = os.use(authorizedMiddleware)

export { authorized }
