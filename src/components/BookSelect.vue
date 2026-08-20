<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBooks, type Book } from '../composables/useBooks'
import { useStorage } from '../composables/useStorage'

const { t } = useI18n()

defineProps<{ modelValue: Book | null }>()
const emit = defineEmits<{ 'update:modelValue': [book: Book | null] }>()

const { searchBooks, createBook } = useBooks()
const { uploadCover } = useStorage()
const uploadingCover = ref(false)

const mode = ref<'search' | 'create'>('search')
const query = ref('')
const results = ref<Book[]>([])
const searching = ref(false)
let debounce: ReturnType<typeof setTimeout> | undefined

// Campos para crear un libro nuevo
const newTitle = ref('')
const newAuthor = ref('')
const newCover = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500'

function onQueryInput() {
  clearTimeout(debounce)
  const q = query.value
  debounce = setTimeout(async () => {
    searching.value = true
    results.value = await searchBooks(q)
    searching.value = false
  }, 300)
}

function select(book: Book) {
  emit('update:modelValue', book)
  query.value = ''
  results.value = []
}

function clearSelection() {
  emit('update:modelValue', null)
  mode.value = 'search'
}

function startCreate() {
  newTitle.value = query.value.trim()
  newAuthor.value = ''
  newCover.value = ''
  createError.value = null
  mode.value = 'create'
}

async function onCoverFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  createError.value = null
  uploadingCover.value = true
  const { url, error } = await uploadCover(file)
  uploadingCover.value = false
  if (error || !url) {
    createError.value = t('bookSelect.errCoverUpload')
    return
  }
  newCover.value = url
}

async function confirmCreate() {
  createError.value = null
  if (newTitle.value.trim().length < 1 || newAuthor.value.trim().length < 1) {
    createError.value = t('bookSelect.errRequired')
    return
  }
  creating.value = true
  const { book, error } = await createBook({
    title: newTitle.value,
    author: newAuthor.value,
    cover_url: newCover.value || null,
  })
  creating.value = false
  if (error || !book) {
    createError.value = t('bookSelect.errCreateFailed')
    return
  }
  select(book)
  mode.value = 'search'
}
</script>

<template>
  <div>
    <span class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">{{ t('bookSelect.label') }}</span>

    <!-- Libro seleccionado -->
    <div
      v-if="modelValue"
      class="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <div class="min-w-0">
        <p class="truncate font-medium text-stone-900 dark:text-stone-100">{{ modelValue.title }}</p>
        <p class="truncate text-sm text-stone-500 dark:text-stone-400">{{ modelValue.author }}</p>
      </div>
      <button
        type="button"
        class="flex-none text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        @click="clearSelection"
      >
        {{ t('bookSelect.change') }}
      </button>
    </div>

    <!-- Modo búsqueda -->
    <div v-else-if="mode === 'search'">
      <input
        v-model="query"
        type="text"
        :class="inputClass"
        :placeholder="t('bookSelect.searchPlaceholder')"
        @input="onQueryInput"
      />

      <ul v-if="results.length" class="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 dark:divide-stone-800 dark:border-stone-700">
        <li v-for="book in results" :key="book.id">
          <button
            type="button"
            class="flex w-full flex-col items-start px-3.5 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
            @click="select(book)"
          >
            <span class="font-medium text-stone-900 dark:text-stone-100">{{ book.title }}</span>
            <span class="text-sm text-stone-500 dark:text-stone-400">{{ book.author }}</span>
          </button>
        </li>
      </ul>

      <p v-else-if="searching" class="mt-2 text-sm text-stone-500 dark:text-stone-400">{{ t('bookSelect.searching') }}</p>
      <p v-else-if="query.trim().length >= 2" class="mt-2 text-sm text-stone-500 dark:text-stone-400">
        {{ t('bookSelect.noMatches') }}
      </p>

      <button
        type="button"
        class="mt-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        @click="startCreate"
      >
        {{ t('bookSelect.addNew') }}
      </button>
    </div>

    <!-- Modo crear -->
    <div v-else class="space-y-2.5">
      <p
        v-if="createError"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ createError }}
      </p>
      <input v-model="newTitle" type="text" :class="inputClass" :placeholder="t('bookSelect.titlePlaceholder')" />
      <input v-model="newAuthor" type="text" :class="inputClass" :placeholder="t('bookSelect.authorPlaceholder')" />
      <div class="flex items-center gap-3">
        <img loading="lazy" decoding="async"
          v-if="newCover.trim()"
          :src="newCover.trim()"
          :alt="t('bookSelect.coverAlt')"
          class="h-16 w-11 flex-none rounded object-cover shadow-sm"
          referrerpolicy="no-referrer"
        />
        <div class="min-w-0 flex-1 space-y-2">
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            :class="uploadingCover ? 'pointer-events-none opacity-60' : ''"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {{ uploadingCover ? t('common.uploading') : t('bookSelect.uploadCover') }}
            <input type="file" accept="image/*" class="hidden" :disabled="uploadingCover" @change="onCoverFile" />
          </label>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="creating"
          class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          @click="confirmCreate"
        >
          {{ creating ? t('bookSelect.adding') : t('bookSelect.addBook') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
          @click="mode = 'search'"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>
