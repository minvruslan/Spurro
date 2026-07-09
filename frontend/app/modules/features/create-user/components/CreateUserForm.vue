<script setup lang="ts">
import type { SupportedProtocolFamily, User } from "@spurro/shared"
import { SUPPORTED_PROTOCOL_FAMILIES } from "@spurro/shared"
import { onMounted, ref } from "vue"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel, FormLayout } from "@/modules/common/components"
import { useCreateUser } from "../composables/useCreateUser"
import type { CreateUserFormValues } from "../types"
import { messages } from "../translations/CreateUserForm"

const DEFAULT_USER_LIMIT = 3

const emit = defineEmits<{ (e: "created", user: User): void; (e: "cancel"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { pending, create } = useCreateUser()
const { showSuccess, showError } = useNotificationBanner()

const protocolFamilies = Object.entries(SUPPORTED_PROTOCOL_FAMILIES).map(
  ([protocolFamily, { name }]) => ({
    protocolFamily: protocolFamily as SupportedProtocolFamily,
    name,
  }),
)

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

const form = ref<CreateUserFormValues>({
  name: "",
  email: "",
  limits: Object.fromEntries(
    protocolFamilies.map(({ protocolFamily }) => [protocolFamily, DEFAULT_USER_LIMIT]),
  ) as Record<SupportedProtocolFamily, number>,
})

const onSubmit = async () => {
  if (pending.value) return
  const user = await create({ ...form.value })
  if (user) {
    showSuccess(t("notifications.created"))
    emit("created", user)
  } else {
    showError(t("notifications.createError"))
  }
}
</script>

<template>
  <FormLayout :disabled="pending" @submit="onSubmit">
    <template #title>
      <h1 class="text-lg font-semibold tracking-tight">{{ t("title") }}</h1>
    </template>

    <template #body>
      <div class="flex flex-col gap-2">
        <FieldLabel for="name" required>{{ t("fields.name.label") }}</FieldLabel>
        <Input
          id="name"
          ref="nameInput"
          v-model="form.name"
          aria-required="true"
          :placeholder="t('fields.name.placeholder')"
        />
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="email" required>{{ t("fields.email.label") }}</FieldLabel>
        <Input
          id="email"
          v-model="form.email"
          type="email"
          aria-required="true"
          :placeholder="t('fields.email.placeholder')"
        />
      </div>

      <div
        v-if="protocolFamilies.length"
        role="group"
        aria-labelledby="limits-label"
        class="flex flex-col gap-2"
      >
        <span id="limits-label" class="text-sm font-medium">{{ t("fields.limits.label") }}</span>
        <label
          v-for="{ protocolFamily, name } in protocolFamilies"
          :key="protocolFamily"
          class="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5"
        >
          <span class="tracking-tight">{{ name }}</span>
          <Input
            v-model.number="form.limits[protocolFamily]"
            type="number"
            min="0"
            class="w-24"
            :aria-label="name"
          />
        </label>
      </div>
    </template>

    <template #actions>
      <Button
        type="button"
        variant="outline"
        class="w-full sm:w-28"
        :disabled="pending"
        @click="emit('cancel')"
      >
        {{ t("actions.cancel") }}
      </Button>
      <Button type="submit" class="w-full sm:w-32" :loading="pending">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("actions.create") }}
      </Button>
    </template>
  </FormLayout>
</template>
