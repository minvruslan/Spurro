import { randomUUID } from "node:crypto"

export function createTestEmail() {
  return `test-${randomUUID()}@test.local`
}
