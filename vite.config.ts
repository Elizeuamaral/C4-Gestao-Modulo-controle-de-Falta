import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('📧 Variáveis de ambiente carregadas:');
  console.log('  - Modo:', mode);
  console.log('  - VITE_APPS_SCRIPT_URL:', env.VITE_APPS_SCRIPT_URL ? '✅ Configurada' : '❌ FALTANDO');
  console.log('  - VITE_SENDER_EMAIL:', env.VITE_SENDER_EMAIL ? '✅ Configurado' : '❌ FALTANDO');
  
  return {
    base: '/C4-Gestao-Modulo-controle-de-Falta/',
    
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'C4 Gestão - Controle de Faltas',
          short_name: 'C4 Faltas',
          description: 'Sistema de controle de falta de estoque',
          theme_color: '#0e1626',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/C4-Gestao-Modulo-controle-de-Falta/',
          start_url: '/C4-Gestao-Modulo-controle-de-Falta/',
          icons: [
            {
              src: '/C4-Gestao-Modulo-controle-de-Falta/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/C4-Gestao-Modulo-controle-de-Falta/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ]
        }
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      port: 5173,
      open: true,
    },

    build: {
      outDir: 'dist',
      sourcemap: true,
    },

    define: {
      'import.meta.env.VITE_APPS_SCRIPT_URL': JSON.stringify(env.VITE_APPS_SCRIPT_URL),
      'import.meta.env.VITE_SENDER_EMAIL': JSON.stringify(env.VITE_SENDER_EMAIL)
    }
  };
});