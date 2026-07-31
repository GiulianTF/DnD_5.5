import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Fichas D&D 2024',
        short_name: 'Fichas D&D',
        description:
          'Criação, evolução e gerenciamento de fichas de D&D 5ª Edição (Livro do Jogador 2024) em Português.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#14100c',
        theme_color: '#8b1e1e',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
