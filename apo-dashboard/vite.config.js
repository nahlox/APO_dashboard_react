import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update SW silently in background
      registerType: 'autoUpdate',

      // Use our hand-crafted manifest.json in /public
      manifest: false,

      // SW filename Vercel will serve as a static file
      filename: 'sw.js',

      workbox: {
        // Cache all built JS/CSS/HTML + icon assets
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],

        // Network-first for Supabase API calls (live data)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },

      // Inject SW registration into the built HTML automatically
      injectRegister: 'auto',
    }),
  ],
})
