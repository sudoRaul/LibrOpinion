<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRealtime } from './composables/useRealtime'
import { useNotifications } from './composables/useNotifications'
import { useFollowRequests } from './composables/useFollowRequests'

const auth = useAuthStore()
const realtime = useRealtime()
const notifications = useNotifications()
const followRequests = useFollowRequests()

// Escucha en vivo y notificaciones mientras haya sesión.
watch(
  () => auth.isAuthenticated,
  (yes) => {
    if (yes) {
      realtime.start()
      notifications.load()
      followRequests.loadCount()
    } else {
      realtime.stop()
      notifications.reset()
      followRequests.reset()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => realtime.stop())
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <RouterView />
  </div>
</template>
