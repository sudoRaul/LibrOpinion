import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Vendor estables en chunks propios: cambian poco → mejor cacheo entre
        // despliegues (el usuario solo re-descarga el código de app al actualizar).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (
            id.includes('vue-router') ||
            id.includes('vue-i18n') ||
            id.includes('pinia') ||
            id.includes('@vue') ||
            id.includes('node_modules/vue/')
          ) {
            return 'vue-vendor'
          }
          return 'vendor'
        },
      },
    },
  },
  server: {
    // Escucha en todas las interfaces y puerto fijo: así el túnel siempre
    // encuentra el dev server (evita el 502 por puerto cambiado a 5174).
    host: true,
    port: 5173,
    strictPort: true,
    // Permite servir el dev a través de túneles (Cloudflare, localtunnel, ngrok)
    // para probar en el móvil. Vite bloquea hosts desconocidos por seguridad.
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'],
  },
})
