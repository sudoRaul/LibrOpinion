<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuotes } from '../composables/useQuotes'
import type { FeedQuote } from '../composables/useFeed'

const { t } = useI18n()

const props = defineProps<{ open: boolean; quote: FeedQuote | null }>()
const emit = defineEmits<{ close: []; updated: [quote: FeedQuote] }>()

const { updateQuote } = useQuotes()

const MAX = 2000
const content = ref('')
const page = ref('')
const note = ref('')
const error = ref<string | null>(null)
const saving = ref(false)

// Rellena el formulario con la cita al abrir.
watch(
  () => [props.open, props.quote?.id] as const,
  () => {
    if (props.open && props.quote) {
      content.value = props.quote.content
      page.value = props.quote.page != null ? String(props.quote.page) : ''
      note.value = props.quote.note ?? ''
      error.value = null
    }
  },
  { immediate: true },
)

async function submit() {
  if (!props.quote) return
  error.value = null

  const text = content.value.trim()
  if (text.length < 1) {
    error.value = t('quoteForm.errWrite')
    return
  }
  if (text.length > MAX) {
    error.value = t('quoteForm.errTooLong', { max: MAX })
    return
  }

  let pageNum: number | null = null
  if (page.value.trim() !== '') {
    const n = Number(page.value)
    if (!Number.isInteger(n) || n <= 0) {
      error.value = t('quoteForm.errPageInvalid')
      return
    }
    pageNum = n
  }

  saving.value = true
  const { quote, error: err } = await updateQuote(props.quote.id, {
    content: text,
    page: pageNum,
    note: note.value.trim() || null,
  })
  saving.value = false

  if (err || !quote) {
    error.value = t('editQuote.errSaveFailed')
    return
  }
  emit('updated', quote)
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open && quote"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div
        class="my-8 w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-label="t('editQuote.title')"
      >
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-display text-2xl font-semibold text-stone-900 dark:text-white">{{ t('editQuote.title') }}</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <p
            v-if="error"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ error }}
          </p>

          <!-- Libro (solo lectura) -->
          <div class="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
            <svg class="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
              <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
            </svg>
            <span class="truncate">{{ quote.book?.title }} · {{ quote.book?.author }}</span>
          </div>

          <div>
            <label for="edit-content" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">{{ t('quoteForm.contentLabel') }}</label>
            <textarea
              id="edit-content"
              v-model="content"
              rows="4"
              :maxlength="MAX"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-quote text-lg text-stone-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            ></textarea>
            <p class="mt-1 text-right text-xs text-stone-400">{{ content.length }} / {{ MAX }}</p>
          </div>

          <div class="w-32">
            <label for="edit-page" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('quoteForm.pageLabel') }} <span class="font-normal text-stone-400">{{ t('common.optionalShort') }}</span>
            </label>
            <input
              id="edit-page"
              v-model="page"
              type="number"
              min="1"
              placeholder="—"
              class="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <div>
            <label for="edit-note" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('quoteForm.noteLabel') }} <span class="font-normal text-stone-400">{{ t('common.optional') }}</span>
            </label>
            <textarea
              id="edit-note"
              v-model="note"
              rows="2"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              @click="emit('close')"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {{ saving ? t('common.saving') : t('common.saveChanges') }}
            </button>
          </div>
        </form>
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
