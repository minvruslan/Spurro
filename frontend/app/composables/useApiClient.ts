import type { ApiClient } from "@vancloak/api-contract"

export const useApiClient = (): ApiClient => useNuxtApp().$apiClient
