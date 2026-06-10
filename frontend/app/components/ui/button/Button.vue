<!-- eslint-disable vue/require-default-prop -->
<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Loader2 } from "lucide-vue-next"
import { Primitive } from "reka-ui"
import { cn } from "~/components/ui/utils/cn"
import { buttonVariants } from "."

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  loading?: boolean
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  loading: false,
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :aria-busy="loading || undefined"
    :class="cn(buttonVariants({ variant, size }), loading && 'pointer-events-none', props.class)"
  >
    <Loader2 v-if="loading" class="animate-spin" aria-hidden="true" />
    <slot v-else />
  </Primitive>
</template>
