<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRealtime } from './composables/useRealtime'

const auth = useAuthStore()
const realtime = useRealtime()

// Escucha en vivo mientras haya sesión.
watch(
  () => auth.isAuthenticated,
  (yes) => (yes ? realtime.start() : realtime.stop()),
  { immediate: true },
)
onBeforeUnmount(() => realtime.stop())
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <RouterView />
  </div>
</template>
