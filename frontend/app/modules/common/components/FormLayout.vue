<script setup lang="ts">
import ViewLayout from "./ViewLayout.vue"

defineProps<{ disabled?: boolean }>()
defineEmits<{ (e: "submit"): void }>()

const onEnter = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement) event.preventDefault()
}
</script>

<template>
  <form
    class="h-full min-h-0"
    novalidate
    @submit.prevent="$emit('submit')"
    @keydown.enter="onEnter"
  >
    <fieldset :disabled="disabled" class="h-full min-h-0 min-w-0">
      <ViewLayout>
        <template #title>
          <slot name="title" />
        </template>
        <template #body>
          <slot name="body" />
        </template>
        <template #actions>
          <slot name="actions" />
        </template>
      </ViewLayout>
    </fieldset>
  </form>
</template>
