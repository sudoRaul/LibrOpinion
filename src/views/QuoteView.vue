<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuote } from '../composables/useQuote'
import ThemeToggle from '../components/ThemeToggle.vue'
import NotificationsBell from '../components/NotificationsBell.vue'
import QuoteCard from '../components/QuoteCard.vue'
import QuoteEditModal from '../components/QuoteEditModal.vue'
import type { FeedQuote } from '../composables/useFeed'

const route = useRoute()
const router = useRouter()
const { quote, loading, notFound, error, load } = useQuote()

const editingQuote = ref<FeedQuote | null>(null)
const copied = ref(false)

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') load(id)
  },
  { immediate: true },
)

function onQuoteDeleted() {
  // La cita ya no existe: volvemos al feed.
  router.push('/app')
}
function onQuoteUpdated(updated: FeedQuote) {
  quote.value = updated
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Si el navegador bloquea el portapapeles, no hacemos nada crítico.
  }
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <!-- Cabecera -->
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
      <!-- Cargando -->
      <div v-if="loading" class="h-52 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/60"></div>

      <!-- No encontrada -->
      <div
        v-else-if="notFound"
        class="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700"
      >
        <p class="font-display text-xl font-semibold text-stone-800 dark:text-stone-100">Cita no encontrada</p>
        <p class="mt-2 text-stone-500 dark:text-stone-400">Puede que se haya eliminado o que el enlace no sea válido.</p>
        <button
          class="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          @click="router.push('/app')"
        >
          Ir al feed
        </button>
      </div>

      <!-- Error -->
      <p
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </p>

      <!-- Cita -->
      <template v-else-if="quote">
        <div class="mb-4 flex items-center justify-between">
          <h1 class="font-display text-lg font-semibold text-stone-900 dark:text-white">Cita</h1>
          <button
            class="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            @click="copyLink"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {{ copied ? '¡Enlace copiado!' : 'Copiar enlace' }}
          </button>
        </div>

        <QuoteCard
          :quote="quote"
          :link-to-detail="false"
          @edit="editingQuote = $event"
          @deleted="onQuoteDeleted"
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
