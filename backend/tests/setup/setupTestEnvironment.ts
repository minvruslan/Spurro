import { TEST_DATABASE_URL } from "@tests/constants/TEST_DATABASE_URL.js"
import { TEST_QUEUE_URL } from "@tests/constants/TEST_QUEUE_URL.js"

process.env.LOG_LEVEL = "silent"
process.env.DOTENV_CONFIG_QUIET = "true"
process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.QUEUE_URL = TEST_QUEUE_URL
process.env.BETTER_AUTH_SECRET = "test-better-auth-secret"
process.env.BETTER_AUTH_URL = "http://localhost:4000"
process.env.PORT = "4000"
process.env.HOST = "localhost"
process.env.ADMIN_EMAIL = "admin@test.local"
process.env.ADMIN_NAME = "Test Admin"
process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, "test").toString("base64")
process.env.APP_SSH_PRIVATE_KEY = [
  "-----BEGIN OPENSSH PRIVATE KEY-----",
  "dGVzdA==",
  "-----END OPENSSH PRIVATE KEY-----",
].join("\n")
process.env.OPERATOR_SSH_PUBLIC_KEY = ""
process.env.DOMAIN_NAME = ""
process.env.IP = "127.0.0.1"
process.env.COUNTRY = "NL"
