<script setup lang="ts">
import { BrandIconWithText } from "@/modules/entities/brand"
import { Separator } from "@/components/ui/separator"
import NavItems from "./NavItems.vue"
import LogoutButton from "./LogoutButton.vue"
</script>

<template>
  <aside class="w-58 shrink-0 rounded-2xl border bg-card p-4 shadow-sm">
    <div class="px-1.5 pb-3">
      <BrandIconWithText />
    </div>
    <NavItems />
    <div class="mt-auto">
      <Separator class="my-3" />
      <ThemeSwitcher class="mb-2 w-full" />
      <LanguageSwitcher class="mb-2 w-full" />
      <LogoutButton />
    </div>
  </aside>
</template>
