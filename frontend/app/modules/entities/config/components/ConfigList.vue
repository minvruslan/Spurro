<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { Shield } from "lucide-vue-next"
import { computed } from "vue"
import ListEmptyState from "@/modules/shared/components/ListEmptyState.vue"
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
  <Transition
    mode="out-in"
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-500"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <ListEmptyState
      v-if="isEmpty"
      key="empty"
      :icon="Shield"
      :title="t('emptyTitle')"
    />

    <div v-else-if="pending" key="skeleton" class="flex flex-col gap-3">
      <ConfigCardSkeleton v-for="i in skeletonCount" :key="i" />
    </div>

    <div v-else key="cards" class="flex flex-col gap-3">
      <ConfigCard
        v-for="config in configs"
        :key="config.id"
        :config="config"
        @open="$emit('open', config)"
      />
    </div>
  </Transition>
</template>
