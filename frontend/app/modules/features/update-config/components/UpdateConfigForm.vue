<script setup lang="ts">
import type { Config, UpdateConfig } from "@spurro/shared"
import { computed, onMounted, ref } from "vue"
import { Save, Trash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldLabel, FormLayout } from "@/modules/common/components"
import { useConfig } from "@/modules/entities/config"
import { useDeviceTypes } from "@/modules/entities/device-type"
import { useUpdateConfig } from "../composables/useUpdateConfig"
import { useDeleteConfig } from "../composables/useDeleteConfig"
import { messages } from "../translations/UpdateConfigForm"

const props = defineProps<{ id: string }>()
const emit = defineEmits<{
  (e: "updated", config: Config): void
  (e: "deleted" | "cancel"): void
}>()

const { t } = useI18n({ useScope: "local", messages })
const { config, status, ready } = useConfig(props.id)
const { deviceTypes, ready: deviceTypesReady } = useDeviceTypes()
const { pending, update } = useUpdateConfig(props.id)
const { pending: deleting, deleteConfig } = useDeleteConfig(props.id)
const { confirm } = useConfirmationDialog()
const { showSuccess, showError } = useNotificationBanner()

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await Promise.all([ready, deviceTypesReady])

const loadedConfig = config.value

const endpointLabel = computed(() => {
  const endpoint = loadedConfig?.endpoint
  if (!endpoint) return ""
  return `${endpoint.server.name} · ${endpoint.protocol.type.name} ${endpoint.protocol.version}`
})

const form = ref<UpdateConfig>({
  name: loadedConfig?.name ?? "",
  deviceTypeId: loadedConfig?.deviceType.id ?? "",
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

  if (await deleteConfig()) {
    showSuccess(t("notifications.deleted"))
    emit("deleted")
  } else {
    showError(t("notifications.deleteError"))
  }
}
</script>

<template>
  <FormLayout v-if="config" :disabled="pending || deleting" @submit="onSubmit">
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
        <FieldLabel for="endpoint">{{ t("fields.endpoint.label") }}</FieldLabel>
        <Input
          id="endpoint"
          :model-value="endpointLabel"
          readonly
          tabindex="-1"
          class="bg-muted text-muted-foreground"
        />
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="deviceType" required>{{ t("fields.deviceType.label") }}</FieldLabel>
        <Select v-model="form.deviceTypeId">
          <SelectTrigger
            id="deviceType"
            class="w-full"
            aria-required="true"
            :disabled="!deviceTypes.length"
          >
            <SelectValue :placeholder="t('fields.deviceType.placeholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="deviceType in deviceTypes"
              :key="deviceType.id"
              :value="deviceType.id"
            >
              {{ deviceType.name }}
            </SelectItem>
          </SelectContent>
        </Select>
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
