import type { ApiClient } from "@spurro/api-contract"

export const useApiClient = (): ApiClient => useNuxtApp().$apiClient
