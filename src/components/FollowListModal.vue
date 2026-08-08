<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFollowList, type FollowListMode, type FollowListUser } from '../composables/useFollowList'

const props = defineProps<{
  open: boolean
  userId: string | null
  mode: FollowListMode
}>()
const emit = defineEmits<{ close: []; changed: [] }>()

const router = useRouter()
const auth = useAuthStore()
const { items, loading, error, load, toggle } = useFollowList()

const title = computed(() => (props.mode === 'followers' ? 'Seguidores' : 'Siguiendo'))
const emptyText = computed(() =>
  props.mode === 'followers' ? 'Todavía no tiene seguidores.' : 'Todavía no sigue a nadie.',
)

function displayName(u: FollowListUser): string {
  return u.display_name || u.username || 'Lector'
}
function initials(u: FollowListUser): string {
  return displayName(u)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Cargar cada vez que se abre (o cambia el objetivo/modo).
watch(
  () => [props.open, props.userId, props.mode] as const,
  () => {
    if (props.open && props.userId) load(props.userId, props.mode)
  },
  { immediate: true },
)

function goTo(u: FollowListUser) {
  if (!u.username) return
  emit('close')
  router.push(`/u/${u.username}`)
}

async function onToggle(u: FollowListUser) {
  const changed = await toggle(u)
  if (changed) emit('changed')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div
        class="my-8 flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <!-- Cabecera -->
        <div class="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-white">{{ title }}</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Cuerpo -->
        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <!-- Cargando -->
          <div v-if="loading" class="space-y-2 p-2">
            <div v-for="n in 5" :key="n" class="h-14 animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/60"></div>
          </div>

          <!-- Error -->
          <p
            v-else-if="error"
            class="m-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ error }}
          </p>

          <!-- Vacío -->
          <p v-else-if="!items.length" class="p-8 text-center text-sm text-stone-500 dark:text-stone-400">
            {{ emptyText }}
          </p>

          <!-- Lista -->
          <ul v-else class="divide-y divide-stone-100 dark:divide-stone-800/70">
            <li v-for="u in items" :key="u.id" class="flex items-center gap-3 px-3 py-2.5">
              <button class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="goTo(u)">
                <img
                  v-if="u.avatar_url"
                  :src="u.avatar_url"
                  :alt="displayName(u)"
                  class="h-10 w-10 flex-none rounded-full object-cover"
                  referrerpolicy="no-referrer"
                />
                <span
                  v-else
                  class="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                >
                  {{ initials(u) }}
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium text-stone-900 dark:text-white">{{ displayName(u) }}</span>
                  <span class="block truncate text-xs text-stone-500 dark:text-stone-400">@{{ u.username }}</span>
                </span>
              </button>

              <!-- Botón seguir / siguiendo (oculto si soy yo) -->
              <button
                v-if="u.id !== auth.user?.id"
                :disabled="u.busy"
                class="flex-none rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
                :class="
                  u.isFollowing
                    ? 'group border border-stone-300 text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                "
                @click="onToggle(u)"
              >
                <template v-if="u.isFollowing">
                  <span class="group-hover:hidden">Siguiendo</span>
                  <span class="hidden group-hover:inline">Dejar de seguir</span>
                </template>
                <template v-else>Seguir</template>
              </button>
              <span v-else class="flex-none text-xs text-stone-400 dark:text-stone-500">Tú</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
