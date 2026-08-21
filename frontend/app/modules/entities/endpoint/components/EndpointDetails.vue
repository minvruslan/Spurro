<script setup lang="ts">
import type { Endpoint } from "@spurro/api-contract"
import { CollapsibleCard } from "@/modules/shared/components"
import { useCountries } from "@/modules/shared/composables"
import { messages } from "../translations/EndpointDetails"

defineProps<{ endpoint: Endpoint }>()

const { t } = useI18n({ useScope: "local", messages })
const { getCountryName } = useCountries()
</script>

<template>
  <CollapsibleCard :title="t('title')" default-open>
    <dl class="flex flex-col gap-2.5 text-sm">
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("server") }}</dt>
        <dd class="truncate">{{ endpoint.server.name }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("country") }}</dt>
        <dd class="truncate">{{ getCountryName(endpoint.server.country) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("protocol") }}</dt>
        <dd class="truncate">{{ endpoint.protocol.name }}</dd>
      </div>
    </dl>
  </CollapsibleCard>
</template>
