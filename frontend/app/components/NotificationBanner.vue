<script setup lang="ts">
import { computed } from "vue"
import { CircleCheck, CircleX, X } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { messages } from "@/translations/NotificationBanner"

const { t } = useI18n({ useScope: "local", messages })
const { notification, dismiss } = useNotificationBanner()

const isError = computed(() => notification.value.type === "error")
const icon = computed(() => (isError.value ? CircleX : CircleCheck))
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-700 ease-out"
    enter-from-class="grid-rows-[0fr] opacity-0"
    enter-to-class="grid-rows-[1fr] opacity-100"
    leave-active-class="transition-all duration-500 ease-out"
    leave-from-class="grid-rows-[1fr] opacity-100"
    leave-to-class="grid-rows-[0fr] opacity-0"
  >
    <div v-if="notification.open" class="grid shrink-0">
      <div class="min-h-0 overflow-hidden">
        <div class="pb-4">
          <div
            :role="isError ? 'alert' : 'status'"
            :aria-live="isError ? 'assertive' : 'polite'"
            class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
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
      </div>
    </div>
  </Transition>
</template>
