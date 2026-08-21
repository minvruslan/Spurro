<script setup lang="ts">
import { computed } from "vue"
import { Check, Download } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import type { CreateConfigWizardMachine } from "../types/CreateConfigWizardMachine"
import { WizardAppsByDeviceTypeCode } from "../settings/WizardAppsByDeviceTypeCode"
import type { WizardApp } from "../types/WizardApp"
import WizardStepHeader from "./WizardStepHeader.vue"
import WizardStepLayout from "./WizardStepLayout.vue"
import { messages } from "../translations/WizardStepApp"

const props = defineProps<{ wizard: CreateConfigWizardMachine }>()

const { t } = useI18n({ useScope: "local", messages })
const { selectedDeviceType, stepNumber, stepCount, chooseApp, back } = props.wizard

const apps = computed(() =>
  selectedDeviceType.value ? WizardAppsByDeviceTypeCode[selectedDeviceType.value.code] : [],
)

const openDownload = (app: WizardApp) => {
  window.open(app.downloadUrl, "_blank", "noopener")
}
</script>

<template>
  <WizardStepLayout>
    <template #header>
      <WizardStepHeader
        :step-number="stepNumber"
        :step-count="stepCount"
        :title="t('title')"
        @back="back"
      />
    </template>

    <p class="mb-4 text-sm leading-relaxed text-muted-foreground sm:mb-4.5">
      {{ t("description") }}
    </p>

    <div class="flex flex-col gap-3 pb-7 max-sm:pb-4.5">
      <div
        v-for="app in apps"
        :key="app.id"
        class="flex shrink-0 flex-col gap-3.5 rounded-lg border bg-muted/15 p-4 dark:bg-transparent"
      >
        <div class="flex items-center gap-3">
          <img :src="app.iconUrl" :alt="app.name" class="size-10 shrink-0 rounded-lg" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ app.name }}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="max-sm:hidden"
            @click="openDownload(app)"
          >
            <Download class="size-4" aria-hidden="true" />
            {{ t("downloadAction") }}
          </Button>
        </div>

        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ t(`apps.${app.id}.description`) }}
        </p>

        <Button type="button" variant="outline" class="w-full sm:hidden" @click="openDownload(app)">
          <Download class="size-4" aria-hidden="true" />
          {{ t("downloadAction") }}
        </Button>

        <Button type="button" variant="outline" class="w-full" @click="chooseApp(app.id)">
          <Check class="size-4" aria-hidden="true" />
          {{ t("installedAction", { name: app.name }) }}
        </Button>
      </div>
    </div>
  </WizardStepLayout>
</template>
