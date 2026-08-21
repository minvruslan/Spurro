<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { FieldLabel, FormLayout } from "@/modules/shared/components"
import { useCountries } from "@/modules/shared/composables"
import { useServer } from "@/modules/entities/server"
import { messages } from "../translations/UpdateServerForm"

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ (e: "cancel"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { server, status, ready } = useServer(props.id)
const { getCountryName } = useCountries()

const endpoints = computed(() => server.value?.endpoints ?? [])
const countryName = computed(() => getCountryName(server.value?.country ?? ""))

await ready
</script>

<template>
  <FormLayout v-if="server">
    <template #title>
      <h1 class="text-lg font-semibold tracking-tight">{{ t("title") }}</h1>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="name">{{ t("fields.name.label") }}</FieldLabel>
          <Input
            id="name"
            :model-value="server.name"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel for="country">{{ t("fields.country.label") }}</FieldLabel>
          <Input
            id="country"
            :model-value="countryName"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="ip">{{ t("fields.ip.label") }}</FieldLabel>
          <Input
            id="ip"
            :model-value="server.ip"
            readonly
            tabindex="-1"
            class="bg-muted text-muted-foreground"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="domain">{{ t("fields.domain.label") }}</FieldLabel>
          <Input
            id="domain"
            :model-value="server.domainName ?? ''"
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
      <Button type="button" variant="outline" class="w-full sm:w-28" @click="emit('cancel')">
        {{ t("actions.close") }}
      </Button>
    </template>
  </FormLayout>

  <p v-else-if="status !== 'pending'" role="alert" class="text-sm text-muted-foreground">
    {{ t("notifications.notFoundError") }}
  </p>
</template>
