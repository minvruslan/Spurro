<script setup lang="ts">
import { Label } from "@/components/ui/label"

defineProps<{ for?: string; required?: boolean }>()
</script>

<template>
  <Label :for="$props.for" class="text-sm font-medium">
    <span>
      <slot />
      <span v-if="required" class="ml-0.5 text-destructive" aria-hidden="true">*</span>
    </span>
  </Label>
</template>
