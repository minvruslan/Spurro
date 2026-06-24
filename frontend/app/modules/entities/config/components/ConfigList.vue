<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { Shield } from "lucide-vue-next"
import { computed } from "vue"
import { ListEmptyState } from "@/modules/common/components"
import ConfigCard from "./ConfigCard.vue"
import ConfigCardSkeleton from "./ConfigCardSkeleton.vue"
import { messages } from "../translations/ConfigList"

const { t } = useI18n({ useScope: "local", messages })

const props = withDefaults(
  defineProps<{
    configs: Config[]
    pending?: boolean
    skeletonCount?: number
  }>(),
  { skeletonCount: 1 },
)

defineEmits<{ (e: "open", config: Config): void }>()

const isEmpty = computed(() => !props.pending && props.configs.length === 0)
</script>

<template>
  <ListEmptyState v-if="isEmpty" :icon="Shield" :title="t('emptyTitle')" />

  <div v-else-if="pending" class="flex flex-col gap-3">
    <ConfigCardSkeleton v-for="i in skeletonCount" :key="i" />
  </div>

  <div v-else class="flex flex-col gap-3">
    <ConfigCard
      v-for="config in configs"
      :key="config.id"
      :config="config"
      @open="$emit('open', config)"
    />
  </div>
</template>
