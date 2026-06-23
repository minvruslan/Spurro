<script setup lang="ts">
import { computed } from "vue"
import { CircleCheck, CircleX, X } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { messages } from "@/translations/NotificationBanner"

const { t } = useI18n({ useScope: "local", messages })
const { notification, dismiss } = useNotificationBanner()

const isError = computed(() => notification.value.type === "error")
const icon = computed(() => (isError.value ? CircleX : CircleCheck))
</script>

<template>
  <Transition
    enter-active-class="overflow-hidden transition-all duration-700 ease-out"
    enter-from-class="max-h-0 opacity-0"
    enter-to-class="max-h-48 opacity-100"
    leave-active-class="overflow-hidden transition-all duration-500 ease-in"
    leave-from-class="max-h-48 opacity-100"
    leave-to-class="max-h-0 opacity-0"
  >
    <div v-if="notification.open" class="shrink-0 overflow-hidden pb-4">
      <div
        :role="isError ? 'alert' : 'status'"
        :aria-live="isError ? 'assertive' : 'polite'"
        class="flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
        :class="
          isError
            ? 'border-destructive/50 bg-destructive/10 text-destructive'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        "
      >
        <component :is="icon" class="size-4 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1">{{ notification.message }}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="-mr-2 size-7 hover:bg-transparent"
          :aria-label="t('dismiss')"
          @click="dismiss"
        >
          <X class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </Transition>
</template>
