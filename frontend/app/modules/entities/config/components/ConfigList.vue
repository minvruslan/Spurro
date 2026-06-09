<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { computed } from "vue"
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
  { skeletonCount: 3 },
)

defineEmits<{ (e: "open", config: Config): void }>()

const isEmpty = computed(() => !props.pending && props.configs.length === 0)
</script>

<template>
  <p v-if="isEmpty" class="text-sm text-muted-foreground">{{ t("empty") }}</p>

  <div v-else class="flex flex-col gap-3">
    <template v-if="pending">
      <ConfigCardSkeleton v-for="i in skeletonCount" :key="i" />
    </template>

    <template v-else>
      <ConfigCard
        v-for="config in configs"
        :key="config.id"
        :config="config"
        @open="$emit('open', config)"
      />
    </template>
  </div>
</template>
