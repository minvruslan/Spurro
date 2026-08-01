import { createORPCClient } from "@orpc/client"
import { OpenAPILink } from "@orpc/openapi-client/fetch"
import type { ApiClient } from "@spurro/api-contract"
import { ApiContract } from "@spurro/api-contract"

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig()

  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {}

  const link = new OpenAPILink(ApiContract, {
    url: import.meta.server ? `${apiBaseUrl}/api` : `${window.location.origin}/api`,
    headers: () => headers,
  })

  const apiClient: ApiClient = createORPCClient(link)

  return { provide: { apiClient } }
})
