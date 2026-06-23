<script setup lang="ts">
import type { User } from "@spurro/shared"
import { onMounted, ref } from "vue"
import { Save, Trash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel, FormLayout } from "@/modules/shared/components"
import { useUser } from "@/modules/entities/user"
import { useProtocolTypes } from "@/modules/entities/protocol-type"
import { useUpdateUser } from "../composables/useUpdateUser"
import { useDeleteUser } from "../composables/useDeleteUser"
import type { UpdateUserFormValues } from "../types"
import { messages } from "../translations/UpdateUserForm"

const props = defineProps<{ id: string }>()
const emit = defineEmits<{
  (e: "updated", user: User): void
  (e: "deleted" | "cancel"): void
}>()

const { t } = useI18n({ useScope: "local", messages })
const { user, status, ready: userReady } = useUser(props.id)
const { protocolTypes, ready: typesReady } = useProtocolTypes()
const { pending, update } = useUpdateUser(props.id)
const { pending: deleting, deleteUser } = useDeleteUser(props.id)
const { confirm } = useConfirmationDialog()
const { showSuccess, showError } = useNotificationBanner()

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await Promise.all([userReady, typesReady])

const loadedUser = user.value
const saved = new Map(
  loadedUser?.limits.map((limit) => [limit.protocolType.id, limit.maxCount]) ?? [],
)

const form = ref<UpdateUserFormValues>({
  name: loadedUser?.name ?? "",
  email: loadedUser?.email ?? "",
  limits: Object.fromEntries(protocolTypes.value.map((type) => [type.id, saved.get(type.id) ?? 0])),
})

const onSubmit = async () => {
  if (pending.value) return
  const updated = await update({ ...form.value })
  if (updated) {
    showSuccess(t("notifications.updated"))
    emit("updated", updated)
  } else {
    showError(t("notifications.updateError"))
  }
}

const onDelete = async () => {
  const confirmed = await confirm({
    title: t("deleteConfirmationDialog.title"),
    description: t("deleteConfirmationDialog.description", { name: form.value.name }),
    confirmButtonText: t("actions.delete"),
    destructive: true,
  })
  if (!confirmed) return

  if (await deleteUser()) {
    showSuccess(t("notifications.deleted"))
    emit("deleted")
  } else {
    showError(t("notifications.deleteError"))
  }
}
</script>

<template>
  <FormLayout v-if="user" :disabled="pending || deleting" @submit="onSubmit">
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
        <FieldLabel for="email">{{ t("fields.email.label") }}</FieldLabel>
        <Input
          id="email"
          :model-value="form.email"
          type="email"
          readonly
          tabindex="-1"
          class="bg-muted text-muted-foreground"
        />
      </div>

      <div
        v-if="protocolTypes.length"
        role="group"
        aria-labelledby="limits-label"
        class="flex flex-col gap-2"
      >
        <span id="limits-label" class="text-sm font-medium">{{ t("fields.limits.label") }}</span>
        <label
          v-for="type in protocolTypes"
          :key="type.id"
          class="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5"
        >
          <span class="tracking-tight">{{ type.name }}</span>
          <Input
            v-model.number="form.limits[type.id]"
            type="number"
            min="0"
            class="w-24"
            :aria-label="type.name"
          />
        </label>
      </div>
    </template>

    <template #actions>
      <Button
        type="button"
        variant="outline"
        class="w-full sm:w-28"
        :disabled="pending || deleting"
        @click="emit('cancel')"
      >
        {{ t("actions.cancel") }}
      </Button>
      <Button
        type="button"
        variant="destructive"
        class="w-full sm:order-first sm:mr-auto sm:w-32"
        :loading="deleting"
        :disabled="pending"
        @click="onDelete"
      >
        <Trash2 class="size-4" aria-hidden="true" />
        {{ t("actions.delete") }}
      </Button>
      <Button type="submit" class="w-full sm:w-32" :loading="pending" :disabled="deleting">
        <Save class="size-4" aria-hidden="true" />
        {{ t("actions.update") }}
      </Button>
    </template>
  </FormLayout>

  <p v-else-if="status !== 'pending'" role="alert" class="text-sm text-muted-foreground">
    {{ t("notifications.notFoundError") }}
  </p>
</template>
