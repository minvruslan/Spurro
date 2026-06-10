<script setup lang="ts">
import type { User } from "@spurro/shared"
import { computed } from "vue"
import UserCard from "./UserCard.vue"
import UserCardSkeleton from "./UserCardSkeleton.vue"
import { messages } from "../translations/UserList"

const { t } = useI18n({ useScope: "local", messages })

const props = withDefaults(
  defineProps<{
    users: User[]
    pending?: boolean
    skeletonCount?: number
  }>(),
  { skeletonCount: 1 },
)

defineEmits<{ (e: "open", user: User): void }>()

const isEmpty = computed(() => !props.pending && props.users.length === 0)
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-500"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <p v-if="isEmpty" key="empty" class="text-sm text-muted-foreground">{{ t("empty") }}</p>

    <div v-else-if="pending" key="skeleton" class="flex flex-col gap-3">
      <UserCardSkeleton v-for="i in skeletonCount" :key="i" />
    </div>

    <div v-else key="cards" class="flex flex-col gap-3">
      <UserCard v-for="user in users" :key="user.id" :user="user" @open="$emit('open', user)" />
    </div>
  </Transition>
</template>
