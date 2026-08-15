<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRealtime } from './composables/useRealtime'
import { useNotifications } from './composables/useNotifications'
import { useFollowRequests } from './composables/useFollowRequests'
import ReportModal from './components/ReportModal.vue'

const auth = useAuthStore()
const realtime = useRealtime()
const notifications = useNotifications()
const followRequests = useFollowRequests()

// Cuenta suspendida: bloquea toda la app (RLS ya oculta su contenido y sus escrituras).
const isBanned = computed(() => auth.profile?.is_banned === true)

async function logout() {
  await auth.signOut()
}

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
    <!-- Cuenta suspendida -->
    <div v-if="isBanned" class="flex min-h-screen items-center justify-center px-4">
      <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" />
          </svg>
        </div>
        <h1 class="mt-5 font-display text-2xl font-semibold text-stone-900 dark:text-white">Cuenta suspendida</h1>
        <p class="mx-auto mt-3 max-w-sm text-stone-500 dark:text-stone-400">
          Tu cuenta ha sido suspendida por incumplir las normas de la comunidad. Si crees que es un error, ponte en contacto con nosotros.
        </p>
        <div
          v-if="auth.profile?.ban_reason"
          class="mx-auto mt-4 max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <span class="font-semibold">Motivo:</span> {{ auth.profile.ban_reason }}
        </div>
        <button
          class="mt-6 rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          @click="logout"
        >
          Cerrar sesión
        </button>
      </div>
    </div>

    <RouterView v-else />

    <!-- Modal de reporte, único para toda la app -->
    <ReportModal />
  </div>
</template>
