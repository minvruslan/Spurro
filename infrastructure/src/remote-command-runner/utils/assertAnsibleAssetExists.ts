import { access } from "node:fs/promises"

export async function assertAnsibleAssetExists(path: string): Promise<void> {
  try {
    await access(path)
  } catch {
    throw new Error(`Ansible asset not found: ${path}`)
  }
}
