import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(i18n)

// Inicializamos la sesión ANTES de montar (y antes de instalar el router),
// para que los guards ya tengan la sesión y el profile resueltos en la primera
// navegación y no haya parpadeo login→feed.
const auth = useAuthStore(pinia)
auth.init().finally(() => {
  app.use(router)
  app.mount('#app')
})
