import { createAuthClient } from "better-auth/vue"
import { magicLinkClient, adminClient } from "better-auth/client/plugins"

export default defineNuxtPlugin(async () => {
  const {
    public: { authBaseUrl },
  } = useRuntimeConfig()

  const authClient = createAuthClient({
    baseURL: authBaseUrl,
    plugins: [magicLinkClient(), adminClient()],
  })

  if (import.meta.server) {
    await useAuthSession().refresh()
  }

  return { provide: { authClient } }
})
