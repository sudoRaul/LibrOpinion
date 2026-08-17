<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReport, REPORT_REASONS } from '../composables/useReport'

const { t } = useI18n()
const { open, target, close, submit } = useReport()

const reason = ref<string>(REPORT_REASONS[0])
const detail = ref('')
const sending = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

const targetText = computed(() => t('report.target' + (
  target.value?.type === 'quote' ? 'Quote' : target.value?.type === 'comment' ? 'Comment' : 'User'
)))

// Reinicia el formulario cada vez que se abre.
watch(open, (isOpen) => {
  if (isOpen) {
    reason.value = REPORT_REASONS[0]
    detail.value = ''
    error.value = null
    done.value = false
    sending.value = false
  }
})

async function onSubmit() {
  error.value = null
  sending.value = true
  const { error: err } = await submit(reason.value, detail.value)
  sending.value = false
  if (err) {
    error.value = t(err)
    return
  }
  done.value = true
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      @click.self="close"
      @keydown.esc="close"
    >
      <div
        class="my-8 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-label="t('report.title')"
      >
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-white">
            {{ done ? t('report.sent') : t('report.title') }}
          </h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            :aria-label="t('common.close')"
            @click="close"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Enviado -->
        <div v-if="done" class="text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p class="mt-4 text-stone-600 dark:text-stone-300">
            {{ t('report.successBody') }}
          </p>
          <button
            class="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            @click="close"
          >
            {{ t('common.close') }}
          </button>
        </div>

        <!-- Formulario -->
        <form v-else class="space-y-4" @submit.prevent="onSubmit">
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ t('report.intro', { target: targetText }) }}
            <template v-if="target?.label"> (<span class="font-medium text-stone-700 dark:text-stone-300">{{ target.label }}</span>)</template>
          </p>

          <p
            v-if="error"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ error }}
          </p>

          <fieldset class="space-y-2">
            <label
              v-for="r in REPORT_REASONS"
              :key="r"
              class="flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
              :class="reason === r ? 'border-emerald-500 bg-emerald-50 text-stone-900 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-white' : 'border-stone-300 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800/50'"
            >
              <input v-model="reason" type="radio" :value="r" class="accent-emerald-600" />
              {{ t('report.reasons.' + r) }}
            </label>
          </fieldset>

          <div>
            <label for="report-detail" class="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              {{ t('report.detailLabel') }} <span class="font-normal text-stone-400">{{ t('common.optional') }}</span>
            </label>
            <textarea
              id="report-detail"
              v-model="detail"
              rows="3"
              maxlength="1000"
              :placeholder="t('report.detailPlaceholder')"
              class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              @click="close"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="sending"
              class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ sending ? t('report.submitting') : t('report.submit') }}
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
