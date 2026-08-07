<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFeed } from '../composables/useFeed'
import ThemeToggle from '../components/ThemeToggle.vue'
import QuoteCard from '../components/QuoteCard.vue'
import QuoteComposerModal from '../components/QuoteComposerModal.vue'
import QuoteEditModal from '../components/QuoteEditModal.vue'
import ProfileSearch from '../components/ProfileSearch.vue'
import type { FeedQuote } from '../composables/useFeed'

const auth = useAuthStore()
const router = useRouter()
const {
  quotes,
  loading,
  error,
  loaded,
  communityQuotes,
  communityLoading,
  communityLoaded,
  loadFeed,
  loadCommunity,
} = useFeed()

const composerOpen = ref(false)
const editingQuote = ref<FeedQuote | null>(null)

function onQuoteDeleted(id: string) {
  quotes.value = quotes.value.filter((q) => q.id !== id)
  communityQuotes.value = communityQuotes.value.filter((q) => q.id !== id)
}
function onQuoteUpdated(updated: FeedQuote) {
  quotes.value = quotes.value.map((q) => (q.id === updated.id ? updated : q))
}

onMounted(async () => {
  if (!loaded.value) await loadFeed()
  loadCommunity()
})

async function logout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <!-- Cabecera fija -->
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <svg class="h-6 w-6 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
            <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
          </svg>
          <span class="font-display text-lg font-semibold text-stone-900 dark:text-white">librOpinion</span>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink
            v-if="auth.profile?.username"
            :to="`/u/${auth.profile.username}`"
            class="flex items-center"
            title="Mi perfil"
          >
            <img
              v-if="auth.profile.avatar_url"
              :src="auth.profile.avatar_url"
              :alt="auth.profile.username"
              class="h-8 w-8 rounded-full object-cover ring-2 ring-transparent transition hover:ring-emerald-500"
              referrerpolicy="no-referrer"
            />
            <span
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 ring-2 ring-transparent transition hover:ring-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              {{ auth.profile.username.charAt(0).toUpperCase() }}
            </span>
          </RouterLink>
          <ThemeToggle />
          <button
            class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            @click="logout"
          >
            Salir
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Buscador de lectores -->
      <div class="mb-4">
        <ProfileSearch />
      </div>

      <!-- Disparador del compositor -->
      <button
        class="mb-6 flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left text-stone-500 shadow-sm transition-colors hover:border-emerald-300 hover:text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-emerald-800"
        @click="composerOpen = true"
      >
        <span class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-700 text-white dark:bg-emerald-600">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        Comparte una cita…
      </button>

      <!-- Cargando -->
      <div v-if="loading && !quotes.length" class="space-y-4">
        <div v-for="n in 3" :key="n" class="h-40 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>
      </div>

      <!-- Error -->
      <p
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </p>

      <!-- Contenido -->
      <template v-else>
        <!-- Tu feed (citas tuyas + de quien sigues) -->
        <div v-if="quotes.length" class="space-y-4">
          <QuoteCard
            v-for="quote in quotes"
            :key="quote.id"
            :quote="quote"
            @edit="editingQuote = $event"
            @deleted="onQuoteDeleted"
          />
        </div>

        <!-- Descubre la comunidad -->
        <section v-if="communityQuotes.length" :class="quotes.length ? 'mt-10' : ''">
          <div class="mb-4">
            <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-white">
              {{ quotes.length ? 'Descubre la comunidad' : 'Aún no sigues a nadie' }}
            </h2>
            <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {{
                quotes.length
                  ? 'Citas recientes de otros lectores que quizá quieras seguir.'
                  : 'Mientras tanto, echa un vistazo a lo que comparte la comunidad.'
              }}
            </p>
          </div>
          <div class="space-y-4">
            <QuoteCard
              v-for="quote in communityQuotes"
              :key="quote.id"
              :quote="quote"
            />
          </div>
        </section>

        <!-- Feed vacío y comunidad aún cargando: esqueleto (evita parpadeo) -->
        <div v-else-if="!quotes.length && communityLoading" class="space-y-4">
          <div v-for="n in 3" :key="n" class="h-40 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>
        </div>

        <!-- Nada por ningún lado (ni feed ni comunidad) -->
        <div
          v-else-if="!quotes.length && communityLoaded"
          class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
        >
          <p class="font-display text-xl font-semibold text-stone-800 dark:text-stone-100">
            Tu feed está en blanco
          </p>
          <p class="mx-auto mt-2 max-w-xs text-stone-500 dark:text-stone-400">
            Publica tu primera cita o sigue a otros lectores para llenar esta página.
          </p>
          <button
            class="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            @click="composerOpen = true"
          >
            Publicar una cita
          </button>
        </div>
      </template>
    </main>

    <QuoteComposerModal :open="composerOpen" @close="composerOpen = false" />
    <QuoteEditModal
      :open="editingQuote !== null"
      :quote="editingQuote"
      @close="editingQuote = null"
      @updated="onQuoteUpdated"
    />
  </div>
</template>
