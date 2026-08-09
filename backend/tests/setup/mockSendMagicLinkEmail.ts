import { vi } from "vitest"

vi.mock("@/core/mailer/index.js", () => ({ sendMagicLinkEmail: vi.fn() }))
