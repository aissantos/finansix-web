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
        // Chunking strategy otimizado
        manualChunks(id) {
          // Core React - sempre usado
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Router - sempre usado
          if (id.includes('react-router')) {
            return 'router-vendor';
          }
          
          // TanStack Query - sempre usado
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Supabase - sempre usado
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          
          // Zustand - pequeno, pode ficar no vendor
          if (id.includes('zustand')) {
            return 'state-vendor';
          }
          
          // Radix UI - dividir por componente para lazy loading
          if (id.includes('@radix-ui/react-dialog')) {
            return 'radix-dialog';
          }
          if (id.includes('@radix-ui/react-dropdown-menu')) {
            return 'radix-dropdown';
          }
          if (id.includes('@radix-ui/react-select')) {
            return 'radix-select';
          }
          if (id.includes('@radix-ui/react-switch')) {
            return 'radix-switch';
          }
          if (id.includes('@radix-ui/react-tabs')) {
            return 'radix-tabs';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-other';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // Icons - separado pois é grande
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
          
          // Charts - usado apenas em analysis page
          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
          
          // React Hook Form - usado em forms
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'form-vendor';
          }
          
          // Zod - validação
          if (id.includes('zod')) {
            return 'validation-vendor';
          }
          
          // Outras libs do node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Compressão máxima
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true, // Remove debuggers
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove funções específicas
      },
      format: {
        comments: false, // Remove comentários
      },
    },
    
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
