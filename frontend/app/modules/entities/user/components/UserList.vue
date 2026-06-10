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
  { skeletonCount: 3 },
)

defineEmits<{ (e: "open", user: User): void }>()

const isEmpty = computed(() => !props.pending && props.users.length === 0)
</script>

<template>
  <p v-if="isEmpty" class="text-sm text-muted-foreground">{{ t("empty") }}</p>

  <div v-else class="flex flex-col gap-3">
    <template v-if="pending">
      <UserCardSkeleton v-for="i in skeletonCount" :key="i" />
    </template>

    <template v-else>
      <UserCard v-for="user in users" :key="user.id" :user="user" @open="$emit('open', user)" />
    </template>
  </div>
</template>
