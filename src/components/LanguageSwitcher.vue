<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '../composables/useLocale'
import type { Locale } from '../i18n'

const { t } = useI18n()
const { locale, setLocale, locales } = useLocale()

const META: Record<string, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  es: { flag: '🇪🇸', name: 'Español' },
}

const current = computed(() => META[locale.value] ?? { flag: '🌐', name: locale.value })

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(l: Locale) {
  void setLocale(l)
  open.value = false
}
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative" @keydown.esc="open = false">
    <!-- Botón -->
    <button
      type="button"
      :aria-label="t('common.language')"
      :aria-expanded="open"
      class="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white/80 py-1.5 pl-2.5 pr-2 text-sm font-medium text-stone-700 shadow-sm backdrop-blur transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-200 dark:hover:bg-stone-700"
      @click="open = !open"
    >
      <span class="text-base leading-none">{{ current.flag }}</span>
      <span class="hidden sm:inline">{{ current.name }}</span>
      <svg
        class="h-4 w-4 text-stone-400 transition-transform"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Menú -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white p-1 shadow-xl dark:border-stone-700 dark:bg-stone-800"
      >
        <button
          v-for="l in locales"
          :key="l"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors"
          :class="l === locale
            ? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-700'"
          @click="choose(l)"
        >
          <span class="text-base leading-none">{{ META[l]?.flag ?? '🌐' }}</span>
          <span class="flex-1">{{ META[l]?.name ?? l }}</span>
          <svg
            v-if="l === locale"
            class="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>
