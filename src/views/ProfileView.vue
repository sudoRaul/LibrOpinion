<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfile, clearActiveProfile } from '../composables/useProfile'
import { useReport } from '../composables/useReport'
import ThemeToggle from '../components/ThemeToggle.vue'
import QuoteCard from '../components/QuoteCard.vue'
import ProfileEditModal from '../components/ProfileEditModal.vue'
import QuoteEditModal from '../components/QuoteEditModal.vue'
import FollowListModal from '../components/FollowListModal.vue'
import NotificationsBell from '../components/NotificationsBell.vue'
import EndOfList from '../components/EndOfList.vue'
import type { FeedQuote } from '../composables/useFeed'
import type { FollowListMode } from '../composables/useFollowList'

const route = useRoute()
const router = useRouter()
const {
  profile,
  quotes,
  followers,
  following,
  followState,
  canSeeContent,
  canSeeLists,
  isSelf,
  loading,
  notFound,
  error,
  followBusy,
  hasIncomingRequest,
  incomingBusy,
  iBlockedThem,
  blockedByThem,
  blockBusy,
  quotesHasMore,
  quotesLoadingMore,
  load,
  loadMoreQuotes,
  toggleFollow,
  refreshCounts,
  acceptIncomingRequest,
  rejectIncomingRequest,
  block,
  unblock,
} = useProfile()

// Menú ⋯ del perfil (bloquear).
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
function onMenuDocClick(e: MouseEvent) {
  if (menuRoot.value && !menuRoot.value.contains(e.target as Node)) menuOpen.value = false
}
onMounted(() => document.addEventListener('click', onMenuDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onMenuDocClick))

async function onBlock() {
  menuOpen.value = false
  await block()
}

const { report } = useReport()
function onReport() {
  menuOpen.value = false
  if (!profile.value) return
  report({ type: 'user', reportedId: profile.value.id, label: '@' + profile.value.username })
}

// Scroll infinito de las citas del perfil.
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
watch(sentinel, (el) => {
  observer?.disconnect()
  if (el) observer?.observe(el)
})
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMoreQuotes()
    },
    { rootMargin: '300px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearActiveProfile()
})

const displayName = computed(
  () => profile.value?.display_name || profile.value?.username || 'Lector',
)
const initials = computed(() =>
  displayName.value
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

const editing = ref(false)
const editingQuote = ref<FeedQuote | null>(null)

// Modal de listas de seguidores / seguidos.
const followListOpen = ref(false)
const followListMode = ref<FollowListMode>('followers')
function openFollowList(mode: FollowListMode) {
  if (!profile.value || !canSeeLists.value) return
  followListMode.value = mode
  followListOpen.value = true
}

function onQuoteDeleted(id: string) {
  quotes.value = quotes.value.filter((q) => q.id !== id)
}
function onQuoteUpdated(updated: FeedQuote) {
  quotes.value = quotes.value.map((q) => (q.id === updated.id ? updated : q))
}

// Recarga al entrar y al navegar entre perfiles distintos.
watch(
  () => route.params.username,
  (username) => {
    if (typeof username === 'string') load(username)
  },
  { immediate: true },
)

function onProfileUpdated(newUsername: string) {
  if (newUsername !== route.params.username) {
    // El username cambió → la URL del perfil también.
    router.replace(`/u/${newUsername}`)
  } else {
    load(newUsername)
  }
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <!-- Cabecera -->
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <RouterLink
          to="/app"
          class="flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Feed
        </RouterLink>
        <div class="flex items-center gap-2">
          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Cargando -->
      <div v-if="loading" class="space-y-4">
        <div class="h-40 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>
        <div class="h-32 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>
      </div>

      <!-- No encontrado -->
      <div v-else-if="notFound" class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
        <p class="font-display text-xl font-semibold text-stone-800 dark:text-stone-100">Perfil no encontrado</p>
        <p class="mt-2 text-stone-500 dark:text-stone-400">No existe ningún usuario con ese nombre.</p>
        <button
          class="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          @click="router.push('/app')"
        >
          Volver al feed
        </button>
      </div>

      <!-- Error -->
      <p
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </p>

      <!-- Perfil -->
      <template v-else-if="profile">
        <!-- Este usuario me ha bloqueado: perfil no disponible -->
        <div
          v-if="blockedByThem"
          class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
        >
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" />
            </svg>
          </div>
          <p class="mt-4 font-display text-lg font-semibold text-stone-800 dark:text-stone-100">Perfil no disponible</p>
          <p class="mx-auto mt-2 max-w-xs text-stone-500 dark:text-stone-400">No puedes ver este perfil.</p>
        </div>

        <template v-else>
        <!-- Aviso: esta persona me ha solicitado seguirme (aceptar/rechazar sin salir) -->
        <div
          v-if="hasIncomingRequest && !iBlockedThem"
          class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30"
        >
          <p class="text-sm text-emerald-900 dark:text-emerald-200">
            <span class="font-semibold">@{{ profile.username }}</span> quiere seguirte
          </p>
          <div class="flex flex-none gap-2">
            <button
              :disabled="incomingBusy"
              class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              @click="acceptIncomingRequest"
            >
              Aceptar
            </button>
            <button
              :disabled="incomingBusy"
              class="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800/70 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              @click="rejectIncomingRequest"
            >
              Rechazar
            </button>
          </div>
        </div>

        <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <img
                v-if="profile.avatar_url"
                :src="profile.avatar_url"
                :alt="displayName"
                class="h-16 w-16 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <div
                v-else
                class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              >
                {{ initials }}
              </div>
              <div class="min-w-0">
                <h1 class="flex items-center gap-1.5 font-display text-2xl font-semibold text-stone-900 dark:text-white">
                  {{ displayName }}
                  <svg
                    v-if="profile.is_private"
                    class="h-4 w-4 text-stone-400 dark:text-stone-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-label="Cuenta privada"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </h1>
                <p class="text-stone-500 dark:text-stone-400">@{{ profile.username }}</p>
              </div>
            </div>

            <!-- Acciones (perfil ajeno) -->
            <div v-if="!isSelf" ref="menuRoot" class="flex flex-none items-center gap-2">
              <!-- Lo tengo bloqueado → desbloquear -->
              <button
                v-if="iBlockedThem"
                :disabled="blockBusy"
                class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                @click="unblock"
              >
                Desbloquear
              </button>

              <!-- Follow tri-estado -->
              <button
                v-else
                :disabled="followBusy"
                class="rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                :class="
                  followState === 'accepted'
                    ? 'group border border-stone-300 text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                    : followState === 'pending'
                      ? 'group border border-stone-300 text-stone-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                "
                @click="toggleFollow"
              >
                <template v-if="followState === 'accepted'">
                  <span class="group-hover:hidden">Siguiendo</span>
                  <span class="hidden group-hover:inline">Dejar de seguir</span>
                </template>
                <template v-else-if="followState === 'pending'">
                  <span class="group-hover:hidden">Solicitado</span>
                  <span class="hidden group-hover:inline">Cancelar</span>
                </template>
                <template v-else>{{ profile.is_private ? 'Solicitar seguir' : 'Seguir' }}</template>
              </button>

              <!-- Menú ⋯ (bloquear) -->
              <div v-if="!iBlockedThem" class="relative" @click.stop>
                <button
                  class="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  aria-label="Más opciones"
                  @click="menuOpen = !menuOpen"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
                  </svg>
                </button>
                <div
                  v-if="menuOpen"
                  class="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800"
                >
                  <button
                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-700"
                    @click="onReport"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <path d="M4 22v-7" />
                    </svg>
                    Reportar
                  </button>
                  <button
                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    @click="onBlock"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" />
                    </svg>
                    Bloquear
                  </button>
                </div>
              </div>
            </div>

            <button
              v-else
              class="flex-none rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              @click="editing = true"
            >
              Editar perfil
            </button>
          </div>

          <p v-if="profile.bio" class="mt-4 text-stone-600 dark:text-stone-300">{{ profile.bio }}</p>

          <div class="mt-4 flex gap-6 text-sm">
            <button
              :disabled="!canSeeLists"
              class="text-stone-600 transition-colors disabled:cursor-default dark:text-stone-400"
              :class="canSeeLists ? 'hover:text-stone-900 dark:hover:text-white' : ''"
              @click="openFollowList('followers')"
            >
              <span class="font-semibold text-stone-900 dark:text-white">{{ followers }}</span> seguidores
            </button>
            <button
              :disabled="!canSeeLists"
              class="text-stone-600 transition-colors disabled:cursor-default dark:text-stone-400"
              :class="canSeeLists ? 'hover:text-stone-900 dark:hover:text-white' : ''"
              @click="openFollowList('following')"
            >
              <span class="font-semibold text-stone-900 dark:text-white">{{ following }}</span> siguiendo
            </button>
          </div>
        </section>

        <!-- Citas del usuario -->
        <h2 class="mb-4 mt-8 font-display text-lg font-semibold text-stone-900 dark:text-white">
          Citas
        </h2>

        <!-- Lo he bloqueado -->
        <div
          v-if="iBlockedThem"
          class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
        >
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" />
            </svg>
          </div>
          <p class="mt-4 font-display text-lg font-semibold text-stone-800 dark:text-stone-100">Has bloqueado a @{{ profile.username }}</p>
          <p class="mx-auto mt-2 max-w-xs text-stone-500 dark:text-stone-400">No veis vuestro contenido mutuamente. Desbloquea para volver a interactuar.</p>
        </div>

        <!-- Cuenta privada que no puedo ver: candado -->
        <div
          v-else-if="!canSeeContent"
          class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
        >
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p class="mt-4 font-display text-lg font-semibold text-stone-800 dark:text-stone-100">Esta cuenta es privada</p>
          <p class="mx-auto mt-2 max-w-xs text-stone-500 dark:text-stone-400">
            {{
              followState === 'pending'
                ? 'Tu solicitud está pendiente de aprobación. Cuando te acepte, verás sus citas.'
                : 'Solicita seguir a @' + profile.username + ' para ver sus citas.'
            }}
          </p>
        </div>

        <template v-else>
          <div v-if="!quotes.length" class="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500 dark:border-stone-700 dark:text-stone-400">
            {{ isSelf ? 'Aún no has publicado ninguna cita.' : 'Todavía no ha publicado citas.' }}
          </div>
          <div v-else class="space-y-4">
            <QuoteCard
              v-for="quote in quotes"
              :key="quote.id"
              :quote="quote"
              @edit="editingQuote = $event"
              @deleted="onQuoteDeleted"
            />
          </div>

          <!-- Scroll infinito: centinela + botón de respaldo -->
          <div v-if="quotes.length && quotesHasMore" ref="sentinel" class="pt-4">
            <div v-if="quotesLoadingMore" class="space-y-4">
              <div v-for="n in 2" :key="n" class="h-40 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>
            </div>
            <button
              v-else
              class="w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 transition-colors hover:border-emerald-300 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-emerald-800 dark:hover:text-white"
              @click="loadMoreQuotes"
            >
              Cargar más
            </button>
          </div>

          <!-- Fin de las citas del perfil -->
          <EndOfList
            v-if="quotes.length && !quotesHasMore"
            :subtitle="isSelf ? 'Has llegado al final de tus citas.' : 'No hay más citas de este lector, por ahora.'"
          />
        </template>

        <ProfileEditModal
          :open="editing"
          :profile="profile"
          @close="editing = false"
          @updated="onProfileUpdated"
        />
        <QuoteEditModal
          :open="editingQuote !== null"
          :quote="editingQuote"
          @close="editingQuote = null"
          @updated="onQuoteUpdated"
        />
        <FollowListModal
          :open="followListOpen"
          :user-id="profile.id"
          :mode="followListMode"
          @close="followListOpen = false"
          @changed="refreshCounts"
        />
        </template>
      </template>
    </main>
  </div>
</template>
