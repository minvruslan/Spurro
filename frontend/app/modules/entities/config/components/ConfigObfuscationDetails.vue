<script setup lang="ts">
import { ProtocolCodeSchema, type ConfigData } from "@spurro/api-contract"
import { computed } from "vue"
import { CollapsibleCard } from "@/modules/common/components"
import { messages } from "../translations/ConfigObfuscationDetails"

const props = defineProps<{ data: ConfigData }>()

const { t } = useI18n({ useScope: "local", messages })

const options = computed(() =>
  props.data.protocolCode === ProtocolCodeSchema.enum.amneziawg2 ? props.data.options : null,
)
</script>

<template>
  <CollapsibleCard v-if="options" :title="t('title')">
    <dl class="flex flex-col gap-2.5 text-sm">
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("fields.protocolProfile") }}</dt>
        <dd>{{ t(`protocolProfile.${options.protocolProfile}`) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("fields.browserFingerprint") }}</dt>
        <dd>
          {{
            options.browserFingerprint
              ? t(`browserFingerprint.${options.browserFingerprint}`)
              : t("browserFingerprintDisabled")
          }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("fields.junkPacketCount") }}</dt>
        <dd>{{ t(`intensity.${options.junkPacketCount}`) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("fields.junkPacketSize") }}</dt>
        <dd>{{ t(`intensity.${options.junkPacketSize}`) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground">{{ t("fields.noisePackets") }}</dt>
        <dd>
          {{
            options.noisePackets
              ? t(`intensity.${options.noisePackets}`)
              : t("noisePacketsDisabled")
          }}
        </dd>
      </div>
    </dl>
  </CollapsibleCard>
</template>
