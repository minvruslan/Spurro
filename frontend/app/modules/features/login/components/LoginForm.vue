<script setup lang="ts">
import { Mail } from "lucide-vue-next"
import { BrandIconWithText } from "@/modules/entities/brand"
import { messages } from "../translations/LoginForm"

const props = defineProps<{ pending?: boolean }>()

const email = defineModel<string>("email", { default: "" })
const emit = defineEmits<{ (e: "submit"): void }>()
const { t } = useI18n({ useScope: "local", messages })

const emailInput = ref<{ $el: HTMLInputElement } | null>(null)
onMounted(() => emailInput.value?.$el?.focus())

const onSubmit = () => {
  if (props.pending) return
  emit("submit")
}
</script>

<template>
  <div class="mb-4 flex flex-col items-center gap-1.5">
    <BrandIconWithText />
    <span class="text-xs text-muted-foreground">{{ t("inviteOnly") }}</span>
  </div>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="flex flex-col gap-2">
      <Label for="email">{{ t("email.label") }}</Label>
      <Input
        id="email"
        ref="emailInput"
        v-model="email"
        type="email"
        autocomplete="email"
        :placeholder="t('email.placeholder')"
      />
    </div>
    <Button type="submit" class="w-full" :loading="pending">
      <Mail class="size-4" aria-hidden="true" />
      {{ t("sendLoginLinkButton") }}
    </Button>
  </form>
</template>
