import { requestLoginLink } from "../services"

export function useLogin() {
  const email = ref("")
  const pending = ref(false)
  const magicLinkSent = ref(false)

  async function submit(): Promise<boolean> {
    pending.value = true
    try {
      await requestLoginLink(email.value)
      magicLinkSent.value = true
      return true
    } catch {
      return false
    } finally {
      pending.value = false
    }
  }

  function reset() {
    magicLinkSent.value = false
  }

  return { email, pending, magicLinkSent, submit, reset }
}
