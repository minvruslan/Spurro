export async function verifyLoginToken(token: string): Promise<void> {
  const { $authClient } = useNuxtApp()
  await $authClient.magicLink.verify({ query: { token } })
}
