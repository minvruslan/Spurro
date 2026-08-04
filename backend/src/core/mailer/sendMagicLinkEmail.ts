import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { authLogger } from "@/core/logger/index.js"

const MAGIC_LINK_FILE = resolve(process.cwd(), "magic-link.log")

export async function sendMagicLinkEmail(email: string, url: string) {
  if (process.env.VITEST) throw new Error("Real sendMagicLinkEmail reached in tests: mock @/core/mailer instead.")
  // TODO: wire up a real email provider.
  await writeFile(MAGIC_LINK_FILE, `${url}\n`)
  authLogger.info({ url }, `Magic link for ${email} saved to ${MAGIC_LINK_FILE}.`)
}
