<script setup lang="ts"></script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="px-7 pt-7 max-sm:px-4.5 max-sm:pt-4.5">
      <slot name="header" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-7 max-sm:px-4.5">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-7 pt-4 pb-7 max-sm:px-4.5 max-sm:pb-4.5 sm:pt-4.5">
      <slot name="footer" />
    </div>
  </div>
</template>
