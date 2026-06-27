<script setup lang="ts">
import type { ServerStatus } from "@spurro/shared"
import { computed } from "vue"
import { getServerStatusStyle } from "../utils/getServerStatusStyle"
import { messages } from "../translations/ServerStatusText"

const props = defineProps<{ status: ServerStatus }>()

const { t } = useI18n({ useScope: "local", messages })

const style = computed(() => getServerStatusStyle(props.status))
</script>

<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium leading-5">
    <span :class="['size-2 flex-none rounded-full', style.dot]" aria-hidden="true" />
    <span :class="style.text">{{ t(`status.${status}`) }}</span>
  </span>
</template>
