<script setup lang="ts">
import { computed } from 'vue'
import type { FeedQuote } from '../composables/useFeed'
import { timeAgo } from '../lib/format'

const props = defineProps<{ quote: FeedQuote }>()

const displayName = computed(
  () => props.quote.author?.display_name || props.quote.author?.username || 'Lector',
)
const handle = computed(() => props.quote.author?.username ?? null)
const initials = computed(() =>
  displayName.value
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
    <!-- Cabecera: autor -->
    <header class="flex items-center gap-3">
      <component
        :is="handle ? 'RouterLink' : 'div'"
        :to="handle ? `/u/${handle}` : undefined"
        class="flex min-w-0 items-center gap-3"
        :class="handle ? 'group/author' : ''"
      >
        <img
          v-if="quote.author?.avatar_url"
          :src="quote.author.avatar_url"
          :alt="displayName"
          class="h-10 w-10 flex-none rounded-full object-cover"
          referrerpolicy="no-referrer"
        />
        <div
          v-else
          class="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
        >
          {{ initials }}
        </div>
        <div class="min-w-0">
          <p class="truncate font-medium text-stone-900 group-hover/author:underline dark:text-white">
            {{ displayName }}
          </p>
          <p class="truncate text-sm text-stone-500 dark:text-stone-400">
            <span v-if="handle">@{{ handle }} · </span>{{ timeAgo(quote.created_at) }}
          </p>
        </div>
      </component>
    </header>

    <!-- Cita -->
    <blockquote class="mt-4 font-quote text-xl leading-relaxed text-stone-800 dark:text-stone-100">
      “{{ quote.content }}”
    </blockquote>

    <!-- Nota personal -->
    <p v-if="quote.note" class="mt-3 text-stone-600 dark:text-stone-300">{{ quote.note }}</p>

    <!-- Libro -->
    <footer class="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60">
      <img
        v-if="quote.book?.cover_url"
        :src="quote.book.cover_url"
        :alt="quote.book?.title"
        class="h-14 w-10 flex-none rounded object-cover shadow-sm"
        referrerpolicy="no-referrer"
      />
      <div
        v-else
        class="flex h-14 w-10 flex-none items-center justify-center rounded bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
        </svg>
      </div>
      <div class="min-w-0">
        <p class="truncate font-medium text-stone-900 dark:text-stone-100">{{ quote.book?.title }}</p>
        <p class="truncate text-sm text-stone-500 dark:text-stone-400">
          {{ quote.book?.author }}<span v-if="quote.page"> · pág. {{ quote.page }}</span>
        </p>
      </div>
    </footer>
  </article>
</template>
