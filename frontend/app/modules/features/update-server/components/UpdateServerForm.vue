<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { computed, onMounted, ref } from "vue"
import { Save, Trash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CountryCombobox, FieldLabel, FormLayout } from "@/modules/common/components"
import { useServer } from "@/modules/entities/server"
import { useUpdateServer } from "../composables/useUpdateServer"
import { useDeleteServer } from "../composables/useDeleteServer"
import type { UpdateServerFormValues } from "../types"
import { messages } from "../translations/UpdateServerForm"

const props = defineProps<{ id: string }>()
const emit = defineEmits<{
  (e: "updated", server: Server): void
  (e: "deleted" | "cancel"): void
}>()

const { t } = useI18n({ useScope: "local", messages })
const { server, status, ready } = useServer(props.id)
const { pending, update } = useUpdateServer(props.id)
const { pending: deleting, deleteServer } = useDeleteServer(props.id)
const { confirm } = useConfirmationDialog()
const { showSuccess, showError } = useNotificationBanner()

const endpoints = computed(() => server.value?.endpoints ?? [])
const isCurrent = computed(() => server.value?.isCurrent ?? false)

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await ready

const loadedServer = server.value

const form = ref<UpdateServerFormValues>({
  name: loadedServer?.name ?? "",
  country: loadedServer?.country ?? "",
  ip: loadedServer?.ip ?? "",
  domainName: loadedServer?.domainName ?? "",
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

  if (await deleteServer()) {
    showSuccess(t("notifications.deleted"))
    emit("deleted")
  } else {
    showError(t("notifications.deleteError"))
  }
}
</script>

<template>
  <FormLayout v-if="server" :disabled="pending || deleting" @submit="onSubmit">
    <template #title>
      <h1 class="text-lg font-semibold tracking-tight">{{ t("title") }}</h1>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="name" required>{{ t("fields.name.label") }}</FieldLabel>
          <Input
            id="name"
            ref="nameInput"
            v-model="form.name"
            aria-required="true"
            :placeholder="t('fields.name.placeholder')"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel for="country" required>{{ t("fields.country.label") }}</FieldLabel>
          <CountryCombobox id="country" v-model="form.country" required />
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="ip">{{ t("fields.ip.label") }}</FieldLabel>
          <Input
            id="ip"
            :model-value="form.ip"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="domain">{{ t("fields.domain.label") }}</FieldLabel>
          <Input
            id="domain"
            :model-value="form.domainName"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
      </div>

      <div
        v-if="endpoints.length"
        role="group"
        aria-labelledby="protocols-label"
        class="flex flex-col gap-2"
      >
        <span id="protocols-label" class="text-sm font-medium">{{
          t("fields.protocols.label")
        }}</span>
        <label
          v-for="endpoint in endpoints"
          :key="endpoint.id"
          class="flex items-center gap-3 rounded-md border px-3 py-2.5"
        >
          <Checkbox :model-value="true" disabled />
          <span class="-mb-0.5 tracking-tight">
            {{ endpoint.protocol.name }}
          </span>
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
        v-if="!isCurrent"
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
