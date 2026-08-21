<script setup lang="ts">
import { ref } from "vue"
import { ChevronDown } from "@lucide/vue"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const props = defineProps<{ title: string; defaultOpen?: boolean }>()

const open = ref(props.defaultOpen ?? false)
</script>

<template>
  <Collapsible v-model:open="open" class="rounded-lg border">
    <CollapsibleTrigger
      class="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span class="text-sm font-semibold">{{ title }}</span>
      <ChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
      />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="px-4 pb-4">
        <slot />
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
