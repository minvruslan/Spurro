<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next"
import { BrandIcon } from "@/modules/entities/brand"
import { messages } from "../translations/LoginEmailSent"

defineProps<{ email: string }>()

const emit = defineEmits<{ (e: "useDifferentEmail"): void }>()
const { t } = useI18n({ useScope: "local", messages })

const heading = ref<HTMLHeadingElement | null>(null)
onMounted(() => heading.value?.focus())
</script>

<template>
  <div class="mb-6 flex justify-center">
    <BrandIcon />
  </div>
  <div class="flex flex-col items-center gap-4 text-center">
    <div class="flex items-center gap-2.5">
      <CheckCircle2 class="size-5 text-green-600" aria-hidden="true" />
      <h1 ref="heading" tabindex="-1" class="text-base font-semibold tracking-tight outline-none">
        {{ t("title") }}
      </h1>
    </div>
    <p class="max-w-72 text-sm leading-relaxed text-muted-foreground">
      {{ t("body", { email }) }}
    </p>
    <Button variant="ghost" size="sm" @click="emit('useDifferentEmail')">
      {{ t("useDifferentEmailButton") }}
    </Button>
  </div>
</template>
