export async function deleteConfig(id: string): Promise<void> {
  await useApiClient().configs.deleteUserConfig({ id })
}
