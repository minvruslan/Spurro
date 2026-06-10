<script setup lang="ts">
import type { User } from "@spurro/shared"
import { ChevronRight, Mail } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { messages } from "../translations/UserCard"

defineProps<{ user: User }>()

defineEmits<{ (e: "open"): void }>()

const { t } = useI18n({ useScope: "local", messages })
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48 shrink-0 truncate text-sm font-semibold">{{ user.name }}</div>
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <Mail class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span class="truncate text-sm text-muted-foreground">{{ user.email }}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" class="shrink-0" @click="$emit('open')">
        {{ t("openButton") }}
        <ChevronRight class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </Card>

  <!-- Mobile -->
  <Card
    class="block cursor-pointer p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:hidden"
    role="button"
    tabindex="0"
    :aria-label="t('openUserAriaLabel', { name: user.name })"
    @click="$emit('open')"
    @keydown.enter="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="truncate text-sm font-semibold">{{ user.name }}</div>
        <div class="flex min-w-0 items-center gap-1.5">
          <Mail class="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span class="truncate text-xs text-muted-foreground">{{ user.email }}</span>
        </div>
      </div>
      <ChevronRight class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  </Card>
</template>
