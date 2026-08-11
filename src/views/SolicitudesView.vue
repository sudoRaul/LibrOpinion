<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFollowRequests, type FollowRequest } from '../composables/useFollowRequests'
import ThemeToggle from '../components/ThemeToggle.vue'
import NotificationsBell from '../components/NotificationsBell.vue'

const router = useRouter()
const { requests, loading, load, accept, reject } = useFollowRequests()

const busy = new Set<string>()

function displayName(r: FollowRequest): string {
  return r.follower?.display_name || r.follower?.username || 'Lector'
}
function initials(r: FollowRequest): string {
  return displayName(r)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function onAccept(r: FollowRequest) {
  if (busy.has(r.follower_id)) return
  busy.add(r.follower_id)
  await accept(r.follower_id)
  busy.delete(r.follower_id)
}
async function onReject(r: FollowRequest) {
  if (busy.has(r.follower_id)) return
  busy.add(r.follower_id)
  await reject(r.follower_id)
  busy.delete(r.follower_id)
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <button
          class="flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
          @click="router.back()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Volver
        </button>
        <div class="flex items-center gap-2">
          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <h1 class="mb-4 font-display text-2xl font-semibold text-stone-900 dark:text-white">Solicitudes de seguimiento</h1>

      <!-- Cargando -->
      <div v-if="loading" class="space-y-2">
        <div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/60"></div>
      </div>

      <!-- Vacío -->
      <div
        v-else-if="!requests.length"
        class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
      >
        <p class="font-display text-lg font-semibold text-stone-800 dark:text-stone-100">No tienes solicitudes pendientes</p>
        <p class="mt-2 text-stone-500 dark:text-stone-400">Cuando alguien pida seguirte, aparecerá aquí.</p>
      </div>

      <!-- Lista -->
      <ul v-else class="space-y-2">
        <li
          v-for="r in requests"
          :key="r.follower_id"
          class="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
        >
          <RouterLink :to="`/u/${r.follower?.username}`" class="flex min-w-0 flex-1 items-center gap-3">
            <img
              v-if="r.follower?.avatar_url"
              :src="r.follower.avatar_url"
              :alt="displayName(r)"
              class="h-11 w-11 flex-none rounded-full object-cover"
              referrerpolicy="no-referrer"
            />
            <span
              v-else
              class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              {{ initials(r) }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-stone-900 dark:text-white">{{ displayName(r) }}</span>
              <span class="block truncate text-xs text-stone-500 dark:text-stone-400">@{{ r.follower?.username }}</span>
            </span>
          </RouterLink>

          <div class="flex flex-none gap-2">
            <button
              class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              @click="onAccept(r)"
            >
              Aceptar
            </button>
            <button
              class="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              @click="onReject(r)"
            >
              Rechazar
            </button>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>
