import { access } from "node:fs/promises"

export async function assertAnsibleAssetExists(path: string): Promise<void> {
  try {
    await access(path)
  } catch {
    throw new Error(`[remote-command-runner] ansible asset not found: ${path}`)
  }
}
