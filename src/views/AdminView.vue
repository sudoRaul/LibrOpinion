<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAdmin, type AdminReport } from '../composables/useAdmin'
import ThemeToggle from '../components/ThemeToggle.vue'

const { reports, loading, error, filter, load, setFilter, setBan, reviewReport } = useAdmin()

const busyId = ref<string | null>(null)

// Modal de baneo: exige escribir el motivo (se envía por correo al usuario).
const banTarget = ref<AdminReport | null>(null)
const banReason = ref('')
const banBusy = ref(false)
const banErr = ref<string | null>(null)

onMounted(load)

const TYPE_LABEL: Record<string, string> = {
  user: 'Perfil',
  quote: 'Cita',
  comment: 'Comentario',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function initial(r: AdminReport['reported']): string {
  return (r?.username ?? r?.display_name ?? '?').charAt(0).toUpperCase()
}

function onToggleBan(r: AdminReport) {
  if (!r.reported) return
  if (r.reported.is_banned) {
    void unban(r) // desbanear: directo, sin motivo
  } else {
    banTarget.value = r // banear: pide motivo
    banReason.value = ''
    banErr.value = null
  }
}

async function unban(r: AdminReport) {
  if (!r.reported) return
  busyId.value = r.id
  await setBan(r.reported.id, false)
  busyId.value = null
}

async function confirmBan() {
  const r = banTarget.value
  if (!r?.reported) return
  const reason = banReason.value.trim()
  if (!reason) {
    banErr.value = 'Escribe el motivo del baneo.'
    return
  }
  banBusy.value = true
  banErr.value = null
  const { error } = await setBan(r.reported.id, true, reason)
  banBusy.value = false
  if (error) {
    banErr.value = error
    return
  }
  banTarget.value = null
}

async function onReview(r: AdminReport, status: 'reviewed' | 'dismissed') {
  busyId.value = r.id
  await reviewReport(r.id, status)
  busyId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
    <!-- Cabecera -->
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <svg class="h-6 w-6 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3 4 6v5c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V6z" />
          </svg>
          <span class="font-display text-lg font-semibold text-stone-900 dark:text-white">librOpinion</span>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink
            to="/app"
            class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Volver
          </RouterLink>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Filtros -->
      <div class="mb-5 flex items-center gap-2">
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="filter === 'pending' ? 'bg-emerald-700 text-white dark:bg-emerald-600' : 'border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'"
          @click="setFilter('pending')"
        >
          Pendientes
        </button>
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="filter === 'all' ? 'bg-emerald-700 text-white dark:bg-emerald-600' : 'border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'"
          @click="setFilter('all')"
        >
          Todos
        </button>
      </div>

      <!-- Carga -->
      <div v-if="loading" class="py-16 text-center text-stone-400">Cargando reportes…</div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ error }}
      </div>

      <!-- Vacío -->
      <div v-else-if="reports.length === 0" class="py-16 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p class="mt-4 text-stone-500 dark:text-stone-400">
          {{ filter === 'pending' ? 'No hay reportes pendientes. Todo en orden.' : 'No hay reportes.' }}
        </p>
      </div>

      <!-- Lista -->
      <ul v-else class="space-y-4">
        <li
          v-for="r in reports"
          :key="r.id"
          class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
        >
          <!-- Cabecera del reporte -->
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {{ r.reason }}
            </span>
            <span class="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
              {{ TYPE_LABEL[r.target_type] ?? r.target_type }}
            </span>
            <span
              class="rounded-md px-2 py-0.5 text-xs font-medium"
              :class="r.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'"
            >
              {{ STATUS_LABEL[r.status] ?? r.status }}
            </span>
            <span class="ml-auto text-xs text-stone-400">{{ formatDate(r.created_at) }}</span>
          </div>

          <!-- Usuario reportado -->
          <div class="flex items-center gap-3">
            <RouterLink v-if="r.reported?.username" :to="`/u/${r.reported.username}`" class="shrink-0">
              <img
                v-if="r.reported.avatar_url"
                :src="r.reported.avatar_url"
                :alt="r.reported.username"
                class="h-10 w-10 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              >
                {{ initial(r.reported) }}
              </span>
            </RouterLink>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <RouterLink
                  v-if="r.reported?.username"
                  :to="`/u/${r.reported.username}`"
                  class="truncate font-medium text-stone-900 hover:underline dark:text-white"
                >
                  @{{ r.reported.username }}
                </RouterLink>
                <span v-else class="text-stone-400">Usuario eliminado</span>
                <span
                  v-if="r.reported?.is_banned"
                  class="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                >
                  Baneado
                </span>
              </div>
              <p class="truncate text-xs text-stone-500 dark:text-stone-400">
                Reportado por
                <RouterLink
                  v-if="r.reporter?.username"
                  :to="`/u/${r.reporter.username}`"
                  class="hover:underline"
                >@{{ r.reporter.username }}</RouterLink>
                <span v-else>alguien</span>
              </p>
            </div>
          </div>

          <!-- Detalle -->
          <p
            v-if="r.detail"
            class="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:bg-stone-800/50 dark:text-stone-300"
          >
            {{ r.detail }}
          </p>

          <!-- Enlaces al contenido -->
          <div class="mt-3 flex flex-wrap gap-3 text-sm">
            <RouterLink
              v-if="r.target_type === 'quote' && r.target_id"
              :to="`/q/${r.target_id}`"
              class="text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Ver cita →
            </RouterLink>
            <RouterLink
              v-if="r.reported?.username"
              :to="`/u/${r.reported.username}`"
              class="text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Ver perfil →
            </RouterLink>
          </div>

          <!-- Acciones -->
          <div class="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
            <button
              v-if="r.reported"
              :disabled="busyId === r.id"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              :class="r.reported.is_banned ? 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-700'"
              @click="onToggleBan(r)"
            >
              {{ r.reported.is_banned ? 'Quitar baneo' : 'Banear usuario' }}
            </button>
            <button
              v-if="r.status === 'pending'"
              :disabled="busyId === r.id"
              class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              @click="onReview(r, 'reviewed')"
            >
              Marcar revisado
            </button>
            <button
              v-if="r.status === 'pending'"
              :disabled="busyId === r.id"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-60 dark:text-stone-400 dark:hover:bg-stone-800"
              @click="onReview(r, 'dismissed')"
            >
              Descartar
            </button>
          </div>
        </li>
      </ul>
    </main>

    <!-- Modal de baneo: motivo obligatorio (se envía por correo al usuario) -->
    <div
      v-if="banTarget"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      @click.self="banTarget = null"
    >
      <div class="my-8 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-white">
          Banear a
          <span class="text-red-600 dark:text-red-400">@{{ banTarget.reported?.username }}</span>
        </h2>
        <p class="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Su contenido se ocultará y recibirá un correo con el motivo. Escríbelo con claridad.
        </p>

        <label for="ban-reason" class="mt-4 mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Motivo del baneo
        </label>
        <textarea
          id="ban-reason"
          v-model="banReason"
          rows="4"
          maxlength="1000"
          placeholder="Ej.: Insultos reiterados a otros usuarios pese a los avisos."
          class="w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
        ></textarea>

        <p v-if="banErr" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ banErr }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            @click="banTarget = null"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="banBusy"
            class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            @click="confirmBan"
          >
            {{ banBusy ? 'Baneando…' : 'Banear y avisar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
