<script setup lang="ts">
import {
  Amneziawg2BrowserFingerprintSchema,
  Amneziawg2IntensitySchema,
  Amneziawg2ProtocolProfileSchema,
  ProtocolCodeSchema,
  ProtocolRegistry,
  type Amneziawg2BrowserFingerprint,
  type Amneziawg2Intensity,
  type Amneziawg2ProtocolProfile,
  type ConfigProtocolOptions,
} from "@spurro/api-contract"
import { computed } from "vue"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldLabel } from "@/modules/shared/components"
import { messages } from "../translations/Amneziawg2ObfuscationFields"

const NONE_OPTION = "none"

const model = defineModel<ConfigProtocolOptions>({ required: true })

const { t } = useI18n({ useScope: "local", messages })

const defaults = ProtocolRegistry[ProtocolCodeSchema.enum.amneziawg2].configOptionsDefaults

const protocolProfile = computed<Amneziawg2ProtocolProfile>({
  get: () => model.value.protocolProfile ?? defaults.protocolProfile,
  set: (value) => {
    model.value.protocolProfile = value
  },
})

const browserFingerprint = computed<Amneziawg2BrowserFingerprint | typeof NONE_OPTION>({
  get: () => model.value.browserFingerprint ?? NONE_OPTION,
  set: (value) => {
    model.value.browserFingerprint = value === NONE_OPTION ? null : value
  },
})

const junkPacketCount = computed<Amneziawg2Intensity>({
  get: () => model.value.junkPacketCount ?? defaults.junkPacketCount,
  set: (value) => {
    model.value.junkPacketCount = value
  },
})

const junkPacketSize = computed<Amneziawg2Intensity>({
  get: () => model.value.junkPacketSize ?? defaults.junkPacketSize,
  set: (value) => {
    model.value.junkPacketSize = value
  },
})

const noisePackets = computed<Amneziawg2Intensity | typeof NONE_OPTION>({
  get: () => model.value.noisePackets ?? NONE_OPTION,
  set: (value) => {
    model.value.noisePackets = value === NONE_OPTION ? null : value
  },
})
</script>

<template>
  <div class="rounded-lg border">
    <h2 class="border-b px-4 py-3 text-sm font-semibold">{{ t("title") }}</h2>

    <div class="flex flex-col gap-4 p-4">
      <div class="flex flex-col gap-2">
        <FieldLabel for="protocolProfile">{{ t("fields.protocolProfile.label") }}</FieldLabel>
        <Select v-model="protocolProfile">
          <SelectTrigger id="protocolProfile" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="profile in Amneziawg2ProtocolProfileSchema.options"
              :key="profile"
              :value="profile"
            >
              {{ t(`fields.protocolProfile.options.${profile}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="browserFingerprint">{{ t("fields.browserFingerprint.label") }}</FieldLabel>
        <Select v-model="browserFingerprint">
          <SelectTrigger id="browserFingerprint" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="NONE_OPTION">
              {{ t(`fields.browserFingerprint.options.${NONE_OPTION}`) }}
            </SelectItem>
            <SelectItem
              v-for="fingerprint in Amneziawg2BrowserFingerprintSchema.options"
              :key="fingerprint"
              :value="fingerprint"
            >
              {{ t(`fields.browserFingerprint.options.${fingerprint}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="junkPacketCount">{{ t("fields.junkPacketCount.label") }}</FieldLabel>
        <Select v-model="junkPacketCount">
          <SelectTrigger id="junkPacketCount" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="intensity in Amneziawg2IntensitySchema.options"
              :key="intensity"
              :value="intensity"
            >
              {{ t(`fields.junkPacketCount.options.${intensity}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="junkPacketSize">{{ t("fields.junkPacketSize.label") }}</FieldLabel>
        <Select v-model="junkPacketSize">
          <SelectTrigger id="junkPacketSize" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="intensity in Amneziawg2IntensitySchema.options"
              :key="intensity"
              :value="intensity"
            >
              {{ t(`fields.junkPacketSize.options.${intensity}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <FieldLabel for="noisePackets">{{ t("fields.noisePackets.label") }}</FieldLabel>
        <Select v-model="noisePackets">
          <SelectTrigger id="noisePackets" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="NONE_OPTION">
              {{ t(`fields.noisePackets.options.${NONE_OPTION}`) }}
            </SelectItem>
            <SelectItem
              v-for="intensity in Amneziawg2IntensitySchema.options"
              :key="intensity"
              :value="intensity"
            >
              {{ t(`fields.noisePackets.options.${intensity}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
