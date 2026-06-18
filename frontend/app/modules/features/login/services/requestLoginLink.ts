export async function requestLoginLink(email: string): Promise<void> {
  const { $authClient } = useNuxtApp()
  const { error } = await $authClient.signIn.magicLink({ email, callbackURL: "/" })
  if (error) throw new Error(error.message ?? "magic-link request failed")
}
