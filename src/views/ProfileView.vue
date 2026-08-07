<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfile } from '../composables/useProfile'
import ThemeToggle from '../components/ThemeToggle.vue'
import QuoteCard from '../components/QuoteCard.vue'
import ProfileEditModal from '../components/ProfileEditModal.vue'
import QuoteEditModal from '../components/QuoteEditModal.vue'
import type { FeedQuote } from '../composables/useFeed'

const route = useRoute()
const router = useRouter()
const {
  profile,
  quotes,
  followers,
  following,
  isFollowing,
  isSelf,
  loading,
  notFound,
  error,
  followBusy,
  load,
  toggleFollow,
} = useProfile()

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
        <ThemeToggle />
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
                <h1 class="font-display text-2xl font-semibold text-stone-900 dark:text-white">{{ displayName }}</h1>
                <p class="text-stone-500 dark:text-stone-400">@{{ profile.username }}</p>
              </div>
            </div>

            <!-- Botón seguir / dejar de seguir -->
            <button
              v-if="!isSelf"
              :disabled="followBusy"
              class="flex-none rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              :class="
                isFollowing
                  ? 'group border border-stone-300 text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
              "
              @click="toggleFollow"
            >
              <template v-if="isFollowing">
                <span class="group-hover:hidden">Siguiendo</span>
                <span class="hidden group-hover:inline">Dejar de seguir</span>
              </template>
              <template v-else>Seguir</template>
            </button>
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
            <span class="text-stone-600 dark:text-stone-400">
              <span class="font-semibold text-stone-900 dark:text-white">{{ followers }}</span> seguidores
            </span>
            <span class="text-stone-600 dark:text-stone-400">
              <span class="font-semibold text-stone-900 dark:text-white">{{ following }}</span> siguiendo
            </span>
          </div>
        </section>

        <!-- Citas del usuario -->
        <h2 class="mb-4 mt-8 font-display text-lg font-semibold text-stone-900 dark:text-white">
          Citas
        </h2>

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
      </template>
    </main>
  </div>
</template>
