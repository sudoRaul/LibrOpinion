<script setup lang="ts">
import { computed } from 'vue'
import { useSuggestions, type Suggestion } from '../composables/useSuggestions'

const { suggestions, follow, isBusy } = useSuggestions()

function displayName(p: Suggestion): string {
  return p.display_name || p.username || 'Lector'
}
function initials(p: Suggestion): string {
  return displayName(p)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const hasSuggestions = computed(() => suggestions.value.length > 0)
</script>

<template>
  <section
    v-if="hasSuggestions"
    class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
  >
    <div class="mb-3 flex items-baseline justify-between px-1">
      <h2 class="font-display text-base font-semibold text-stone-900 dark:text-white">
        A quién seguir
      </h2>
      <span class="text-xs text-stone-400 dark:text-stone-500">Desliza →</span>
    </div>

    <!-- Slider horizontal con scroll-snap; sin flechas, deslizable con el dedo. -->
    <div
      class="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <article
        v-for="p in suggestions"
        :key="p.id"
        class="flex w-40 flex-none snap-start flex-col items-center rounded-xl border border-stone-200 bg-stone-50 p-4 text-center dark:border-stone-800 dark:bg-stone-950/40"
      >
        <RouterLink :to="`/u/${p.username}`" class="group flex flex-col items-center">
          <img
            v-if="p.avatar_url"
            :src="p.avatar_url"
            :alt="displayName(p)"
            class="h-14 w-14 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-emerald-400"
            referrerpolicy="no-referrer"
          />
          <span
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 ring-2 ring-transparent transition group-hover:ring-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-400"
          >
            {{ initials(p) }}
          </span>
          <span class="mt-2 line-clamp-1 max-w-full text-sm font-medium text-stone-900 group-hover:underline dark:text-white">
            {{ displayName(p) }}
          </span>
          <span class="line-clamp-1 max-w-full text-xs text-stone-500 dark:text-stone-400">
            @{{ p.username }}
          </span>
        </RouterLink>

        <button
          :disabled="isBusy(p.id)"
          class="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          @click="follow(p)"
        >
          Seguir
        </button>
      </article>
    </div>
  </section>
</template>
