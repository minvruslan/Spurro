<script setup lang="ts">
import type { Config, Endpoint, UpsertConfig } from "@spurro/shared"
import { onMounted, ref } from "vue"
import { Plus } from "lucide-vue-next"
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
import { useEndpoints } from "@/modules/entities/endpoint"
import { useDeviceTypes } from "@/modules/entities/device-type"
import { useCreateConfig } from "../composables/useCreateConfig"
import { messages } from "../translations/CreateConfigForm"

const emit = defineEmits<{ (e: "created", config: Config): void; (e: "cancel"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { endpoints, ready: endpointsReady } = useEndpoints()
const { deviceTypes, ready: deviceTypesReady } = useDeviceTypes()
const { pending, create } = useCreateConfig()
const { showSuccess, showError } = useNotificationBanner()

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await Promise.all([endpointsReady, deviceTypesReady])

const form = ref<UpsertConfig>({
  name: "",
  endpointId: "",
  deviceTypeId: "",
})

const endpointLabel = (endpoint: Endpoint) =>
  `${endpoint.server.name} · ${endpoint.protocol.type.name} ${endpoint.protocol.version}`

const onSubmit = async () => {
  if (pending.value) return

  const config = await create({ ...form.value })

  if (config) {
    showSuccess(t("notifications.created"))
    emit("created", config)
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
        <FieldLabel for="endpoint" required>{{ t("fields.endpoint.label") }}</FieldLabel>
        <Select v-model="form.endpointId">
          <SelectTrigger
            id="endpoint"
            class="w-full"
            aria-required="true"
            :disabled="!endpoints.length"
          >
            <SelectValue :placeholder="t('fields.endpoint.placeholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="endpoint in endpoints" :key="endpoint.id" :value="endpoint.id">
              {{ endpointLabel(endpoint) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="!endpoints.length" class="text-sm text-muted-foreground">
          {{ t("fields.endpoint.empty") }}
        </p>
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
        <p v-if="!deviceTypes.length" class="text-sm text-muted-foreground">
          {{ t("fields.deviceType.empty") }}
        </p>
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
