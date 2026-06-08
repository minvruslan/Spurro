<script setup lang="ts">
import type { DateValue } from "reka-ui"
import { CalendarDate } from "@internationalized/date"
import { computed, ref, watch } from "vue"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const props = defineProps<{
  modelValue: string | null
  precision: "day" | "month"
  placeholder?: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const open = ref(false)

const currentYear = ref(
  props.modelValue ? Number(props.modelValue.slice(0, 4)) : new Date().getFullYear(),
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) currentYear.value = Number(val.slice(0, 4))
  },
)

const calendarValue = computed<CalendarDate | undefined>(() => {
  if (!props.modelValue || props.modelValue.length < 10) return undefined
  const [y, m, d] = props.modelValue.split("-").map(Number)
  return new CalendarDate(y!, m!, d!)
})

const selectedMonth = computed(() =>
  props.modelValue ? Number(props.modelValue.slice(5, 7)) : null,
)
const selectedYear = computed(() =>
  props.modelValue ? Number(props.modelValue.slice(0, 4)) : null,
)

const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(new Date(2000, i, 1)),
)

const label = computed(() => {
  if (!props.modelValue) return null
  if (props.precision === "month") {
    const [y, m] = props.modelValue.split("-").map(Number)
    return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
      new Date(y!, m! - 1, 1),
    )
  }
  if (props.modelValue.length < 10) return null
  const [y, m, d] = props.modelValue.split("-").map(Number)
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y!, m! - 1, d!))
})

function onDaySelect(date: DateValue | undefined) {
  if (!date) return
  emit("update:modelValue", date.toString())
  open.value = false
}

function onMonthSelect(month: number) {
  emit("update:modelValue", `${currentYear.value}-${String(month).padStart(2, "0")}-01`)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="w-full justify-start text-left font-normal"
        :class="!label && 'text-muted-foreground'"
      >
        {{ label ?? placeholder ?? "Выберите дату" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        v-if="precision === 'day'"
        :model-value="calendarValue"
        locale="ru"
        @update:model-value="onDaySelect"
      />
      <div v-else class="p-3 w-52">
        <div class="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="currentYear--"> ‹ </Button>
          <span class="text-sm font-medium">{{ currentYear }}</span>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="currentYear++"> › </Button>
        </div>
        <div class="grid grid-cols-3 gap-1">
          <Button
            v-for="(name, i) in monthNames"
            :key="i"
            :variant="selectedYear === currentYear && selectedMonth === i + 1 ? 'default' : 'ghost'"
            size="sm"
            class="h-8 text-xs"
            @click="onMonthSelect(i + 1)"
          >
            {{ name }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
