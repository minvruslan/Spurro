import { UserSessionSchema, type UserSession } from "@spurro/shared"

export function useAuthSession() {
  const user = useState<UserSession | null>("auth.user", () => null)
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === "admin")

  async function refresh(): Promise<void> {
    const {
      public: { apiBaseUrl },
    } = useRuntimeConfig()

    try {
      const data = await $fetch<{ user?: unknown } | null>("/api/auth/get-session", {
        baseURL: import.meta.server ? apiBaseUrl : undefined,
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
      })
      user.value = data?.user ? UserSessionSchema.parse(data.user) : null
    } catch {
      user.value = null
    }
  }

  return { user, isLoggedIn, isAdmin, refresh }
}
