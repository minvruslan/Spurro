<script setup lang="ts">
import type { Component } from "vue"
import { computed } from "vue"
import { Ghost, Scale, SlidersHorizontal } from "@lucide/vue"
import type { ConfigObfuscationLevel } from "../types/ConfigObfuscationLevel"

const props = defineProps<{ level: ConfigObfuscationLevel }>()

const IconByLevel: Record<ConfigObfuscationLevel, Component> = {
  medium: Scale,
  high: Ghost,
  custom: SlidersHorizontal,
}

const icon = computed(() => IconByLevel[props.level])
</script>

<template>
  <component :is="icon" aria-hidden="true" />
</template>
