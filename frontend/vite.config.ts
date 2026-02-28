/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    server: {
      deps: {
        inline: [/@risquesavantachat\/shared-types/],
      },
    },
  },
  resolve: {
    alias: {
      '@': src,
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@infra': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.georisques\.gouv\.fr\/api\/v1\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'georisques-cache', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 86400 }, networkTimeoutSeconds: 5 },
          },
        ],
      },
      manifest: {
        name: 'RisquesAvantAchat',
        short_name: 'Risques',
        description: 'Connaître les risques avant d\'acheter',
        theme_color: '#0d9488',
        background_color: '#0a0a0b',
        display: 'standalone',
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/georisques': {
        target: 'https://www.georisques.gouv.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/georisques/, '/api/v1'),
      },
    },
  },
})
