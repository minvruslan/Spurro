<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { onMounted, ref } from "vue"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CountryCombobox, FieldLabel, FormLayout } from "@/modules/shared/components"
import { useProtocols } from "@/modules/entities/protocol"
import { useCreateServer } from "../composables/useCreateServer"
import type { CreateServerFormValues } from "../types"
import { messages } from "../translations/CreateServerForm"

const emit = defineEmits<{ (e: "created", server: Server): void; (e: "cancel"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { protocols, ready } = useProtocols()
const { pending, error, submit } = useCreateServer()

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => nameInput.value?.$el?.focus())

await ready

const form = ref<CreateServerFormValues>({
  name: "",
  country: "",
  ip: "",
  domainName: "",
  login: "",
  password: "",
  protocolIds: protocols.value.map((protocol) => protocol.id),
})

const isProtocolSelected = (id: string) => form.value.protocolIds.includes(id)
const toggleProtocolSelection = (id: string, checked: boolean) => {
  form.value.protocolIds = checked
    ? [...form.value.protocolIds, id]
    : form.value.protocolIds.filter((protocolId) => protocolId !== id)
}

const onSubmit = async () => {
  if (pending.value) return
  const server = await submit({ ...form.value })
  if (server) emit("created", server)
}
</script>

<template>
  <FormLayout v-if="protocols.length" :disabled="pending" @submit="onSubmit">
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
          <FieldLabel for="ip" required>{{ t("ip.label") }}</FieldLabel>
          <Input
            id="ip"
            v-model="form.ip"
            aria-required="true"
            :placeholder="t('ip.placeholder')"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="domain">{{ t("domain.label") }}</FieldLabel>
          <Input id="domain" v-model="form.domainName" :placeholder="t('domain.placeholder')" />
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="login" required>{{ t("login.label") }}</FieldLabel>
          <Input
            id="login"
            v-model="form.login"
            aria-required="true"
            autocomplete="off"
            :placeholder="t('login.placeholder')"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <FieldLabel for="password" required>{{ t("password.label") }}</FieldLabel>
          <Input
            id="password"
            v-model="form.password"
            type="password"
            aria-required="true"
            autocomplete="new-password"
          />
        </div>
      </div>

      <div role="group" aria-labelledby="protocols-label" class="flex flex-col gap-2">
        <span id="protocols-label" class="text-sm font-medium">{{ t("protocols.label") }}</span>
        <label
          v-for="protocol in protocols"
          :key="protocol.id"
          class="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 has-[:disabled]:cursor-not-allowed"
        >
          <Checkbox
            :model-value="isProtocolSelected(protocol.id)"
            @update:model-value="(checked) => toggleProtocolSelection(protocol.id, !!checked)"
          />
          <span class="-mb-0.5 tracking-tight"
            >{{ protocol.type.name }} {{ protocol.version }}</span
          >
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
        <Plus class="size-4" aria-hidden="true" />
        {{ t("submit") }}
      </Button>
    </template>
  </FormLayout>
</template>
