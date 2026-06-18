<script setup lang="ts">
import DesktopNav from "@/components/admin-layout/DesktopNav.vue"
import MobileNav from "@/components/admin-layout/MobileNav.vue"
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-muted/40">
    <!-- Mobile -->
    <header class="border-b bg-background lg:hidden">
      <MobileNav />
    </header>

    <!-- Desktop -->
    <div class="mx-auto flex w-full max-w-295 flex-1 gap-7 px-4 py-6 lg:px-7 lg:py-7">
      <DesktopNav class="hidden lg:flex lg:flex-col" />

      <main class="min-w-0 flex-1">
        <div class="mx-auto max-w-215">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
