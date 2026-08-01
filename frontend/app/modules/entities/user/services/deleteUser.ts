export async function deleteUser(id: string): Promise<void> {
  await useApiClient().users.deleteUser({ id })
}
