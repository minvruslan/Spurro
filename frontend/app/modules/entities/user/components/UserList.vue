<script setup lang="ts">
import type { User } from "@spurro/shared"
import { Users } from "lucide-vue-next"
import { computed } from "vue"
import { ListEmptyState } from "@/modules/common/components"
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
  <ListEmptyState v-if="isEmpty" :icon="Users" :title="t('emptyTitle')" />

  <div v-else-if="pending" class="flex flex-col gap-3">
    <UserCardSkeleton v-for="i in skeletonCount" :key="i" />
  </div>

  <div v-else class="flex flex-col gap-3">
    <UserCard v-for="user in users" :key="user.id" :user="user" @open="$emit('open', user)" />
  </div>
</template>
