<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProfileSearch, type ProfileHit } from '../composables/useProfileSearch'

const router = useRouter()
const { t } = useI18n()
const { searchProfiles } = useProfileSearch()

const query = ref('')
const results = ref<ProfileHit[]>([])
const open = ref(false)
const searching = ref(false)
const root = ref<HTMLElement | null>(null)
let debounce: ReturnType<typeof setTimeout> | undefined

function nameOf(hit: ProfileHit) {
  return hit.display_name || hit.username || t('profile.readerFallback')
}
function initialsOf(hit: ProfileHit) {
  return nameOf(hit)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function onInput() {
  clearTimeout(debounce)
  open.value = true
  const q = query.value
  debounce = setTimeout(async () => {
    searching.value = true
    results.value = await searchProfiles(q)
    searching.value = false
  }, 250)
}

function go(hit: ProfileHit) {
  if (!hit.username) return
  router.push(`/u/${hit.username}`)
  query.value = ''
  results.value = []
  open.value = false
}

// Cierra el desplegable al hacer clic fuera.
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  clearTimeout(debounce)
})
</script>

<template>
  <div ref="root" class="relative">
    <div class="relative">
      <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        v-model="query"
        type="text"
        :placeholder="t('search.placeholder')"
        class="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-11 pr-3.5 text-stone-900 placeholder:text-stone-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
        @input="onInput"
        @focus="open = true"
      />
    </div>

    <!-- Desplegable de resultados -->
    <div
      v-if="open && query.trim().length >= 2"
      class="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <ul v-if="results.length" class="max-h-80 divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
        <li v-for="hit in results" :key="hit.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
            @click="go(hit)"
          >
            <img
              v-if="hit.avatar_url"
              :src="hit.avatar_url"
              :alt="nameOf(hit)"
              class="h-9 w-9 flex-none rounded-full object-cover"
              referrerpolicy="no-referrer"
            />
            <span
              v-else
              class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              {{ initialsOf(hit) }}
            </span>
            <span class="min-w-0">
              <span class="block truncate font-medium text-stone-900 dark:text-stone-100">{{ nameOf(hit) }}</span>
              <span class="block truncate text-sm text-stone-500 dark:text-stone-400">@{{ hit.username }}</span>
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="px-3.5 py-3 text-sm text-stone-500 dark:text-stone-400">
        {{ searching ? t('common.searching') : t('search.noResults') }}
      </p>
    </div>
  </div>
</template>
