<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications, type AppNotification } from '../composables/useNotifications'

const router = useRouter()
const { items, unread, loading, loaded, load, markAllRead, markRead } = useNotifications()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
  if (open.value && !loaded.value) load()
}
function close() {
  open.value = false
}

// Cerrar al pulsar fuera del componente.
function onDocPointer(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close()
}
document.addEventListener('pointerdown', onDocPointer)
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointer))

function actorName(n: AppNotification): string {
  return n.actor?.display_name || n.actor?.username || 'Alguien'
}
function actorInitials(n: AppNotification): string {
  return actorName(n)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function verb(n: AppNotification): string {
  if (n.type === 'follow') return 'empezó a seguirte'
  if (n.type === 'like') return 'le dio me gusta a tu cita'
  if (n.type === 'comment') return 'comentó tu cita'
  return ''
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'ahora'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

async function onClickItem(n: AppNotification) {
  await markRead(n.id)
  close()
  // Like/comment → a la cita concreta; follow → al perfil del actor.
  if ((n.type === 'like' || n.type === 'comment') && n.quote_id) {
    router.push(`/q/${n.quote_id}`)
  } else if (n.actor?.username) {
    router.push(`/u/${n.actor.username}`)
  }
}
</script>

<template>
  <div ref="root" class="relative">
    <!-- Campana -->
    <button
      class="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
      aria-label="Notificaciones"
      @click="toggle"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span
        v-if="unread > 0"
        class="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <!-- Panel -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed left-4 right-4 top-16 z-50 flex max-h-[70vh] flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 dark:border-stone-800 dark:bg-stone-900"
      >
        <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <h3 class="font-display text-base font-semibold text-stone-900 dark:text-white">Notificaciones</h3>
          <button
            v-if="unread > 0"
            class="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            @click="markAllRead"
          >
            Marcar todas como leídas
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <!-- Cargando -->
          <div v-if="loading && !items.length" class="space-y-2 p-3">
            <div v-for="n in 4" :key="n" class="h-12 animate-pulse rounded-lg bg-stone-200/70 dark:bg-stone-800/60"></div>
          </div>

          <!-- Vacío -->
          <p v-else-if="!items.length" class="p-8 text-center text-sm text-stone-500 dark:text-stone-400">
            No tienes notificaciones todavía.
          </p>

          <!-- Lista -->
          <ul v-else class="divide-y divide-stone-100 dark:divide-stone-800/70">
            <li v-for="n in items" :key="n.id">
              <button
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
                :class="!n.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''"
                @click="onClickItem(n)"
              >
                <img
                  v-if="n.actor?.avatar_url"
                  :src="n.actor.avatar_url"
                  :alt="actorName(n)"
                  class="h-9 w-9 flex-none rounded-full object-cover"
                  referrerpolicy="no-referrer"
                />
                <span
                  v-else
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                >
                  {{ actorInitials(n) }}
                </span>

                <span class="min-w-0 flex-1">
                  <span class="text-sm text-stone-800 dark:text-stone-200">
                    <span class="font-semibold">{{ actorName(n) }}</span>
                    {{ ' ' + verb(n) }}
                  </span>
                  <span
                    v-if="n.quote?.content"
                    class="mt-0.5 block truncate text-xs italic text-stone-500 dark:text-stone-400"
                  >
                    «{{ n.quote.content }}»
                  </span>
                  <span class="mt-0.5 block text-xs text-stone-400 dark:text-stone-500">{{ timeAgo(n.created_at) }}</span>
                </span>

                <span v-if="!n.read" class="mt-1.5 h-2 w-2 flex-none rounded-full bg-emerald-500"></span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
