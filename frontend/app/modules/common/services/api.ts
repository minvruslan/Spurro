export const useApi = () => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig()
  return $fetch.create({
    baseURL: import.meta.server ? apiBaseUrl : undefined,
    headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
  })
}
