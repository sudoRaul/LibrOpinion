<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { FeedQuote } from '../composables/useFeed'
import { useLikes } from '../composables/useLikes'
import { useComments, type Comment } from '../composables/useComments'
import { useQuotes } from '../composables/useQuotes'
import { useAuthStore } from '../stores/auth'
import { timeAgo } from '../lib/format'

const props = defineProps<{ quote: FeedQuote }>()
const emit = defineEmits<{ edit: [quote: FeedQuote]; deleted: [id: string] }>()

const auth = useAuthStore()
const likes = useLikes()
const comments = useComments()
const { deleteQuote } = useQuotes()

// Solo el dueño ve el menú de editar/borrar (la garantía real es RLS).
const isOwn = computed(() => props.quote.user_id === auth.user?.id)

const menuOpen = ref(false)
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const menuRoot = ref<HTMLElement | null>(null)

function closeMenu() {
  menuOpen.value = false
  confirmingDelete.value = false
  deleteError.value = null
}
function onEdit() {
  emit('edit', props.quote)
  closeMenu()
}
async function onDelete() {
  deleteError.value = null
  deleting.value = true
  const { error } = await deleteQuote(props.quote.id)
  deleting.value = false
  if (error) {
    // Dejamos el menú abierto para que el error sea visible.
    deleteError.value = error
    return
  }
  emit('deleted', props.quote.id)
  closeMenu()
}
function onDocClick(e: MouseEvent) {
  if (menuRoot.value && !menuRoot.value.contains(e.target as Node)) closeMenu()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const like = computed(() => likes.get(props.quote.id))

const displayName = computed(
  () => props.quote.author?.display_name || props.quote.author?.username || 'Lector',
)
const handle = computed(() => props.quote.author?.username ?? null)
const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

// --- Comentarios ---
const showComments = ref(false)
const newComment = ref('')
const adding = ref(false)
const commentError = ref<string | null>(null)

async function toggleComments() {
  showComments.value = !showComments.value
  if (showComments.value && !comments.isLoaded(props.quote.id)) {
    await comments.load(props.quote.id)
  }
}

async function submitComment() {
  const text = newComment.value.trim()
  if (!text) return
  commentError.value = null
  adding.value = true
  const { error } = await comments.add(props.quote.id, text)
  adding.value = false
  if (error) {
    commentError.value = error
    return
  }
  newComment.value = ''
}

const cName = (c: Comment) => c.author?.display_name || c.author?.username || 'Lector'
</script>

<template>
  <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
    <!-- Cabecera: autor + menú -->
    <header class="flex items-start justify-between gap-3">
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
          {{ initials(displayName) }}
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

      <!-- Menú de la cita (solo si es mía). @click.stop evita que los clics
           internos lleguen a document y cierren el menú por el "clic fuera". -->
      <div v-if="isOwn" ref="menuRoot" class="relative flex-none" @click.stop>
        <button
          class="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          aria-label="Opciones de la cita"
          @click="menuOpen = !menuOpen"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
          </svg>
        </button>

        <div
          v-if="menuOpen"
          class="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800"
        >
          <template v-if="!confirmingDelete">
            <button
              class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-700"
              @click="onEdit"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              Editar
            </button>
            <button
              class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              @click="confirmingDelete = true"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
              Eliminar
            </button>
          </template>
          <div v-else class="p-3">
            <p class="text-sm text-stone-700 dark:text-stone-200">¿Eliminar esta cita?</p>
            <p v-if="deleteError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ deleteError }}</p>
            <div class="mt-3 flex justify-end gap-2">
              <button
                class="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                @click="confirmingDelete = false"
              >
                Cancelar
              </button>
              <button
                :disabled="deleting"
                class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                @click="onDelete"
              >
                {{ deleting ? 'Eliminando…' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
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

    <!-- Acciones -->
    <div class="mt-3 flex items-center gap-1 border-t border-stone-100 pt-3 dark:border-stone-800">
      <button
        class="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
        :class="like.liked ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400'"
        :aria-pressed="like.liked"
        @click="likes.toggle(quote.id)"
      >
        <svg
          class="h-5 w-5 transition-transform"
          :class="like.liked ? 'heart-pop' : 'group-hover:scale-110'"
          viewBox="0 0 24 24"
          :fill="like.liked ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span :class="like.count ? '' : 'text-stone-400'">{{ like.count || 'Me gusta' }}</span>
      </button>

      <button
        class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-400"
        :class="showComments ? 'text-emerald-700 dark:text-emerald-400' : ''"
        @click="toggleComments"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
        </svg>
        <span :class="comments.getCount(quote.id) ? '' : 'text-stone-400'">
          {{ comments.getCount(quote.id) || 'Comentar' }}
        </span>
      </button>
    </div>

    <!-- Panel de comentarios -->
    <section v-if="showComments" class="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
      <!-- Composer -->
      <form class="flex items-start gap-2" @submit.prevent="submitComment">
        <div class="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <img
            v-if="auth.profile?.avatar_url"
            :src="auth.profile.avatar_url"
            alt="Tú"
            class="h-8 w-8 rounded-full object-cover"
            referrerpolicy="no-referrer"
          />
          <span v-else>{{ (auth.profile?.username ?? '?').charAt(0).toUpperCase() }}</span>
        </div>
        <div class="flex-1">
          <input
            v-model="newComment"
            type="text"
            maxlength="1000"
            placeholder="Añade un comentario…"
            class="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
          <p v-if="commentError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ commentError }}</p>
        </div>
        <button
          type="submit"
          :disabled="adding || !newComment.trim()"
          class="flex-none rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {{ adding ? '…' : 'Enviar' }}
        </button>
      </form>

      <!-- Lista -->
      <ul class="mt-4 space-y-4">
        <li v-for="c in comments.getList(quote.id)" :key="c.id" class="flex gap-2.5">
          <component
            :is="c.author?.username ? 'RouterLink' : 'div'"
            :to="c.author?.username ? `/u/${c.author.username}` : undefined"
            class="flex-none"
          >
            <img
              v-if="c.author?.avatar_url"
              :src="c.author.avatar_url"
              :alt="cName(c)"
              class="h-8 w-8 rounded-full object-cover"
              referrerpolicy="no-referrer"
            />
            <div
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600 dark:bg-stone-700 dark:text-stone-300"
            >
              {{ initials(cName(c)) }}
            </div>
          </component>
          <div class="min-w-0 flex-1">
            <div class="rounded-2xl bg-stone-100 px-3 py-2 dark:bg-stone-800">
              <p class="text-sm">
                <RouterLink
                  v-if="c.author?.username"
                  :to="`/u/${c.author.username}`"
                  class="font-medium text-stone-900 hover:underline dark:text-white"
                >
                  {{ cName(c) }}
                </RouterLink>
                <span v-else class="font-medium text-stone-900 dark:text-white">{{ cName(c) }}</span>
              </p>
              <p class="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm text-stone-700 dark:text-stone-200">{{ c.content }}</p>
            </div>
            <div class="mt-1 flex items-center gap-3 px-3 text-xs text-stone-400">
              <span>{{ timeAgo(c.created_at) }}</span>
              <button
                v-if="c.user_id === auth.user?.id"
                class="hover:text-red-500"
                @click="comments.remove(quote.id, c.id)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </article>
</template>
