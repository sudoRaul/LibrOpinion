<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Book } from '../composables/useBooks'
import { useQuotes } from '../composables/useQuotes'
import { useFeed, type FeedQuote } from '../composables/useFeed'
import BookSelect from './BookSelect.vue'

const { t } = useI18n()

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; published: [quote: FeedQuote] }>()

const { createQuote } = useQuotes()
const { prependQuote } = useFeed()

const MAX = 2000
const book = ref<Book | null>(null)
const content = ref('')
const page = ref('')
const note = ref('')
const error = ref<string | null>(null)
const saving = ref(false)

function reset() {
  book.value = null
  content.value = ''
  page.value = ''
  note.value = ''
  error.value = null
  saving.value = false
}

// Al cerrar, limpiamos el formulario.
watch(
  () => props.open,
  (open) => {
    if (!open) reset()
  },
)

async function submit() {
  error.value = null

  if (!book.value) {
    error.value = t('compose.errChooseBook')
    return
  }
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
  const { quote, error: err } = await createQuote({
    bookId: book.value.id,
    content: text,
    page: pageNum,
    note: note.value.trim() || null,
  })
  saving.value = false

  if (err || !quote) {
    error.value = t('compose.errPublishFailed')
    return
  }
  prependQuote(quote)
  emit('published', quote)
  emit('close')
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
        class="my-8 w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-label="t('compose.aria')"
      >
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-display text-2xl font-semibold text-stone-900 dark:text-white">{{ t('compose.title') }}</h2>
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

          <BookSelect v-model="book" />

          <div>
            <label for="content" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('quoteForm.contentLabel') }}
            </label>
            <textarea
              id="content"
              v-model="content"
              rows="4"
              :maxlength="MAX"
              :placeholder="t('quoteForm.contentPlaceholder')"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-quote text-lg text-stone-900 placeholder:font-sans placeholder:text-base placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
            ></textarea>
            <p class="mt-1 text-right text-xs text-stone-400">{{ content.length }} / {{ MAX }}</p>
          </div>

          <div class="w-32">
            <label for="page" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('quoteForm.pageLabel') }} <span class="font-normal text-stone-400">{{ t('common.optionalShort') }}</span>
            </label>
            <input
              id="page"
              v-model="page"
              type="number"
              min="1"
              placeholder="—"
              class="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <div>
            <label for="note" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('quoteForm.noteLabel') }} <span class="font-normal text-stone-400">{{ t('common.optional') }}</span>
            </label>
            <textarea
              id="note"
              v-model="note"
              rows="2"
              :placeholder="t('quoteForm.notePlaceholder')"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
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
              {{ saving ? t('compose.submitting') : t('compose.submit') }}
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
