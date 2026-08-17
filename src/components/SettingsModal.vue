<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocale } from '../composables/useLocale'
import type { Locale } from '../i18n'

const { t } = useI18n()
const { locale, setLocale, locales } = useLocale()

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const META: Record<string, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  es: { flag: '🇪🇸', name: 'Español' },
}

function choose(l: Locale) {
  void setLocale(l)
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
        class="my-8 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-label="t('settings.title')"
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="font-display text-2xl font-semibold text-stone-900 dark:text-white">{{ t('settings.title') }}</h2>
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

        <!-- Idioma -->
        <section>
          <h3 class="text-sm font-semibold text-stone-800 dark:text-stone-200">{{ t('settings.languageLabel') }}</h3>
          <p class="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{{ t('settings.languageDesc') }}</p>
          <div class="mt-3 space-y-2">
            <button
              v-for="l in locales"
              :key="l"
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors"
              :class="l === locale
                ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-200 dark:hover:border-stone-700 dark:hover:bg-stone-800'"
              @click="choose(l)"
            >
              <span class="text-lg leading-none">{{ META[l]?.flag ?? '🌐' }}</span>
              <span class="flex-1">{{ META[l]?.name ?? l }}</span>
              <svg
                v-if="l === locale"
                class="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
          </div>
        </section>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            @click="emit('close')"
          >
            {{ t('common.close') }}
          </button>
        </div>
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
