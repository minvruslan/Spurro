<script setup lang="ts">
import type { Protocol } from "@spurro/shared"
import { onMounted, ref } from "vue"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CountryCombobox, FieldLabel } from "@/modules/shared/components"
import type { CreateServerFormValues } from "../types"
import { messages } from "../translations/CreateServerForm"

const props = defineProps<{ protocols: Protocol[]; pending?: boolean; error?: boolean }>()

const emit = defineEmits<{ (e: "submit", values: CreateServerFormValues): void }>()

const { t } = useI18n({ useScope: "local", messages })

const form = ref<CreateServerFormValues>({
  name: "",
  country: "",
  ip: "",
  domainName: "",
  login: "",
  password: "",
  protocolIds: props.protocols.map((protocol) => protocol.id),
})

const nameInput = ref<{ $el: HTMLInputElement } | null>(null)
onMounted(() => nameInput.value?.$el?.focus())

const isProtocolSelected = (id: string) => form.value.protocolIds.includes(id)
const toggleProtocolSelection = (id: string, checked: boolean) => {
  form.value.protocolIds = checked
    ? [...form.value.protocolIds, id]
    : form.value.protocolIds.filter((protocolId) => protocolId !== id)
}

const onSubmit = () => {
  if (props.pending) return
  emit("submit", { ...form.value })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
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
        <Input id="ip" v-model="form.ip" aria-required="true" :placeholder="t('ip.placeholder')" />
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
        class="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5"
      >
        <Checkbox
          :model-value="isProtocolSelected(protocol.id)"
          @update:model-value="(checked) => toggleProtocolSelection(protocol.id, !!checked)"
        />
        <span class="font-semibold tracking-tight">
          {{ protocol.type.name }} {{ protocol.version }}
        </span>
      </label>
    </div>

    <p v-if="error" role="alert" class="text-sm text-destructive">{{ t("error") }}</p>

    <Button type="submit" class="mt-1 w-full" :loading="pending">
      <Plus class="size-4" aria-hidden="true" />
      {{ t("submit") }}
    </Button>
  </form>
</template>
