import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon.png', 'icons/*.png'],
      manifest: {
        name: 'Finansix',
        short_name: 'Finansix',
        description: 'Gestão financeira pessoal e familiar',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#135BEC',
        orientation: 'portrait-primary',
        lang: 'pt-BR',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        screenshots: [
          {
            src: 'screenshots/home.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Tela inicial do Finansix'
          }
        ],
        shortcuts: [
          {
            name: 'Nova Transação',
            short_name: 'Nova',
            description: 'Adicionar nova transação',
            url: '/transactions/new',
            icons: [{ src: 'icons/shortcut-add.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: 'Carteira',
            short_name: 'Carteira',
            description: 'Ver cartões e contas',
            url: '/wallet',
            icons: [{ src: 'icons/shortcut-wallet.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      }
    }),
    // Bundle analyzer - gera stats.html
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    sourcemap: false, // Disable sourcemaps in prod for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: {
          'ml-vendor': ['@tensorflow/tfjs'],
          'ocr-vendor': ['tesseract.js'],
          'pdf-vendor': ['pdfjs-dist'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-toast'],
        },
        
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Compressão máxima
    minify: 'esbuild', // Faster than terser, good enough for most cases. 
    // Use 'terser' if bundle size is absolutely critical and build time is secondary.
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Otimização de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'date-fns/format',
      'date-fns/startOfMonth',
      'date-fns/endOfMonth',
      'date-fns/addMonths',
      'date-fns/subMonths',
    ],
    exclude: ['lucide-react'], // Tree-shake icons
  },
});
