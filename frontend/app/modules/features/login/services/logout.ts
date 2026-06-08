export async function logout(): Promise<void> {
  const { $authClient } = useNuxtApp()
  await $authClient.signOut()
  useAuthSession().user.value = null
  await navigateTo("/login")
}
