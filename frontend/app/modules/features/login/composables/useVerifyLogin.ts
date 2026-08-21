import { verifyLoginToken } from "../services"

export function useVerifyLogin() {
  const { isLoggedIn, isAdmin, refresh } = useAuthSession()
  const token = ref<string | null>(null)
  const pending = ref(false)
  const failed = ref(false)

  onMounted(() => {
    token.value = new URLSearchParams(window.location.hash.slice(1)).get("token")
    if (!token.value) failed.value = true
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    )
  })

  async function submit() {
    if (!token.value || pending.value) return
    pending.value = true
    try {
      await verifyLoginToken(token.value)
      await refresh()
      if (!isLoggedIn.value) {
        failed.value = true
        return
      }
      await navigateTo(isAdmin.value ? "/admin" : "/app")
    } catch {
      failed.value = true
    } finally {
      pending.value = false
    }
  }

  return { pending, failed, submit }
}
