import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
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
