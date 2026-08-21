<script setup lang="ts">
import type { Config } from "@spurro/api-contract"
import { computed } from "vue"
import { Plus } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { useConfigs } from "@/modules/entities/config"
import { isReachedConfigLimit, useConfigLimits } from "@/modules/entities/config-limit"
import ConfigListEmptyState from "./ConfigListEmptyState.vue"
import ConfigListSelf from "./ConfigListSelf.vue"
import { messages } from "../translations/ConfigListCard"

defineEmits<{ (e: "open", config: Config): void; (e: "create"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { configs, status, error } = useConfigs()
const { configLimits } = useConfigLimits()

const isEmpty = computed(
  () => status.value !== "pending" && !error.value && configs.value.length === 0,
)
const limitReached = computed(() => configLimits.value.some(isReachedConfigLimit))
</script>

<template>
  <div
    class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card p-7 max-sm:p-4.5"
  >
    <div v-if="isEmpty" class="flex flex-1 flex-col items-center justify-center">
      <ConfigListEmptyState @create="$emit('create')" />
    </div>

    <template v-else>
      <div class="hidden items-center justify-between gap-3 sm:flex">
        <h1 class="text-lg font-semibold tracking-tight">{{ t("title") }}</h1>
        <Button :disabled="limitReached" @click="$emit('create')">
          <Plus class="size-4" aria-hidden="true" />
          {{ t("createAction") }}
        </Button>
      </div>

      <Button class="w-full sm:hidden" :disabled="limitReached" @click="$emit('create')">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("createAction") }}
      </Button>

      <ConfigListSelf @open="$emit('open', $event)" />
    </template>
  </div>
</template>
