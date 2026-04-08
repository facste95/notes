import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Folia',
        short_name: 'Folia',
        description: 'Minimal writing app',
        theme_color: '#faf9f7',
        background_color: '#faf9f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,woff2}']
      }
    })
  ],
  test: {
    include: ['src/**/*.test.js'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['src/test-setup.js']
  }
});
