<script setup lang="ts">
import type { ConfigLimit } from "@spurro/shared"
import { computed } from "vue"
import ConfigLimitCard from "./ConfigLimitCard.vue"
import ConfigLimitCardSkeleton from "./ConfigLimitCardSkeleton.vue"
import { messages } from "../translations/ConfigLimitList"

const { t } = useI18n({ useScope: "local", messages })

const props = withDefaults(
  defineProps<{
    configLimits: ConfigLimit[]
    withLimit?: boolean
    pending?: boolean
    skeletonCount?: number
  }>(),
  { skeletonCount: 2 },
)

const isEmpty = computed(() => !props.pending && props.configLimits.length === 0)
</script>

<template>
  <p v-if="isEmpty" class="text-sm text-muted-foreground">{{ t("empty") }}</p>

  <div v-else class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
    <template v-if="pending">
      <ConfigLimitCardSkeleton v-for="i in skeletonCount" :key="i" :with-limit="withLimit" />
    </template>

    <template v-else>
      <ConfigLimitCard
        v-for="configLimit in configLimits"
        :key="configLimit.id"
        :protocol-type="configLimit.protocolType"
        :used="configLimit.used"
        :max="configLimit.maxCount"
        :with-limit="withLimit"
      />
    </template>
  </div>
</template>
