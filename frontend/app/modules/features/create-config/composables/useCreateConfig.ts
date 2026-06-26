import { ref } from "vue"
import type { Config, UpsertConfig } from "@spurro/shared"
import { createConfig } from "@/modules/entities/config"

export function useCreateConfig() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function create(payload: UpsertConfig): Promise<Config | null> {
    if (pending.value) return null

    pending.value = true
    error.value = null

    try {
      return await createConfig(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error"
      return null
    } finally {
      pending.value = false
    }
  }

  return { pending, error, create }
}
