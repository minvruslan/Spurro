export async function deleteServer(id: string): Promise<void> {
  await useApiClient().servers.deleteServer({ id })
}
