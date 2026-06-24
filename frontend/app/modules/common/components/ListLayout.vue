<script setup lang="ts"></script>

<template>
  <section class="flex h-full min-h-0 flex-col gap-4.5">
    <div class="flex shrink-0 items-center justify-between gap-2 pr-2">
      <slot name="title" />
      <div v-if="$slots.action" class="hidden sm:block">
        <slot name="action" />
      </div>
    </div>

    <div v-if="$slots.action" class="shrink-0 sm:hidden">
      <slot name="action" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pr-2">
      <slot name="body" />
    </div>
  </section>
</template>
