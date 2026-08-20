<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEGAL, LEGAL_UPDATED, type LegalKey } from '../content/legal'

const props = defineProps<{ doc: LegalKey }>()
const { locale, t } = useI18n()

const lang = computed<'es' | 'en'>(() => (locale.value === 'es' ? 'es' : 'en'))
const content = computed(() => LEGAL[lang.value][props.doc])
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <!-- Cabecera -->
    <header class="border-b border-stone-200 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="flex items-center gap-2">
          <svg class="h-6 w-6 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
            <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
          </svg>
          <span class="font-display text-lg font-semibold tracking-tight text-stone-900 dark:text-white">librOpinion</span>
        </RouterLink>
        <RouterLink
          to="/"
          class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
        >
          {{ t('legal.back') }}
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-6 py-12">
      <h1 class="font-display text-4xl font-semibold tracking-tight text-stone-900 dark:text-white">
        {{ content.title }}
      </h1>
      <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
        {{ t('legal.updated') }}: {{ LEGAL_UPDATED }}
      </p>
      <p v-if="content.intro" class="mt-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
        {{ content.intro }}
      </p>

      <section
        v-for="(s, i) in content.sections"
        :key="i"
        class="mt-8"
      >
        <h2 v-if="s.heading" class="font-display text-xl font-semibold text-stone-900 dark:text-white">
          {{ s.heading }}
        </h2>
        <p
          v-for="(p, j) in s.paragraphs"
          :key="'p' + j"
          class="mt-3 leading-relaxed text-stone-600 dark:text-stone-300"
        >
          {{ p }}
        </p>
        <ul
          v-if="s.bullets"
          class="mt-3 list-disc space-y-1.5 pl-6 text-stone-600 dark:text-stone-300"
        >
          <li v-for="(b, k) in s.bullets" :key="'b' + k" class="leading-relaxed">{{ b }}</li>
        </ul>
      </section>

      <!-- Enlaces entre documentos legales -->
      <nav class="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200 pt-6 text-sm dark:border-stone-800">
        <RouterLink to="/privacidad" class="text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.privacy.linkLabel') }}</RouterLink>
        <RouterLink to="/terminos" class="text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.terms.linkLabel') }}</RouterLink>
        <RouterLink to="/aviso-legal" class="text-emerald-700 hover:underline dark:text-emerald-400">{{ t('legal.notice.linkLabel') }}</RouterLink>
      </nav>
    </main>
  </div>
</template>
