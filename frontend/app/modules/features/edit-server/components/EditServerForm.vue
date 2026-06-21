<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { computed, onMounted, ref } from "vue"
import { Save } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CountryCombobox, FieldLabel, FormLayout } from "@/modules/shared/components"
import { useServer } from "@/modules/entities/server"
import { useEditServer } from "../composables/useEditServer"
import type { EditServerFormValues } from "../types"
import { messages } from "../translations/EditServerForm"

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ (e: "updated", server: Server): void; (e: "cancel"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { server, status, ready } = useServer(props.id)
const { pending, error, submit } = useEditServer(props.id)

const endpoints = computed(() => server.value?.endpoints ?? [])

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await ready

const loadedServer = server.value

const form = ref<EditServerFormValues>({
  name: loadedServer?.name ?? "",
  country: loadedServer?.country ?? "",
  ip: loadedServer?.ip ?? "",
  domainName: loadedServer?.domainName ?? "",
})

const onSubmit = async () => {
  if (pending.value) return
  const updated = await submit({ ...form.value })
  if (updated) emit("updated", updated)
}
</script>

<template>
  <FormLayout v-if="server" :disabled="pending" @submit="onSubmit">
    <template #title>
      <h1 class="text-lg font-semibold tracking-tight">{{ t("title") }}</h1>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="name" required>{{ t("name.label") }}</FieldLabel>
          <Input
            id="name"
            ref="nameInput"
            v-model="form.name"
            aria-required="true"
            :placeholder="t('name.placeholder')"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel for="country" required>{{ t("country.label") }}</FieldLabel>
          <CountryCombobox id="country" v-model="form.country" required />
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="ip">{{ t("ip.label") }}</FieldLabel>
          <Input
            id="ip"
            :model-value="form.ip"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="domain">{{ t("domain.label") }}</FieldLabel>
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
        <span id="protocols-label" class="text-sm font-medium">{{ t("protocols.label") }}</span>
        <label
          v-for="endpoint in endpoints"
          :key="endpoint.id"
          class="flex items-center gap-3 rounded-md border px-3 py-2.5"
        >
          <Checkbox :model-value="true" disabled />
          <span class="-mb-0.5 tracking-tight">
            {{ endpoint.protocol.type.name }} {{ endpoint.protocol.version }}
          </span>
        </label>
      </div>
    </template>

    <template #action>
      <p v-if="error" role="alert" class="mr-auto text-sm text-destructive">{{ t("error") }}</p>
      <Button
        type="button"
        variant="outline"
        class="w-[7rem]"
        :disabled="pending"
        @click="emit('cancel')"
      >
        {{ t("cancel") }}
      </Button>
      <Button type="submit" class="w-[8rem]" :loading="pending">
        <Save class="size-4" aria-hidden="true" />
        {{ t("submit") }}
      </Button>
    </template>
  </FormLayout>

  <p v-else-if="status !== 'pending'" role="alert" class="text-sm text-muted-foreground">
    {{ t("notFound") }}
  </p>
</template>
