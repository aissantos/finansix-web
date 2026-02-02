// vite.config.ts
import { defineConfig } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.7_terser@5.46.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.7_terser@5.46.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@2.79.2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { VitePWA } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/vite-plugin-pwa@0.19.8_vite@5.4.21_@types+node@22.19.7_terser@5.46.0__workbox-build@7.4.0_@ty_ivnnrtt4t5kawwnc4dd6yfcgli/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Versix\\Finansix\\finansix-web";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true,
        type: "module"
      },
      includeAssets: ["favicon.png", "icons/*.png"],
      manifest: {
        name: "Finansix",
        short_name: "Finansix",
        description: "Gest\xE3o financeira pessoal e familiar",
        start_url: "/",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#135BEC",
        orientation: "portrait-primary",
        lang: "pt-BR",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ],
        screenshots: [
          {
            src: "screenshots/home.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Tela inicial do Finansix"
          }
        ],
        shortcuts: [
          {
            name: "Nova Transa\xE7\xE3o",
            short_name: "Nova",
            description: "Adicionar nova transa\xE7\xE3o",
            url: "/transactions/new",
            icons: [{ src: "icons/shortcut-add.png", sizes: "96x96", type: "image/png" }]
          },
          {
            name: "Carteira",
            short_name: "Carteira",
            description: "Ver cart\xF5es e contas",
            url: "/wallet",
            icons: [{ src: "icons/shortcut-wallet.png", sizes: "96x96", type: "image/png" }]
          }
        ]
      }
    }),
    // Bundle analyzer - gera stats.html
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 3e3,
    host: true
  },
  build: {
    sourcemap: false,
    // Disable sourcemaps in prod for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: {
          "ml-vendor": ["@tensorflow/tfjs"],
          "ocr-vendor": ["tesseract.js"],
          "pdf-vendor": ["pdfjs-dist"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-toast"]
        },
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Compressão máxima
    minify: "esbuild",
    // Faster than terser, good enough for most cases. 
    // Use 'terser' if bundle size is absolutely critical and build time is secondary.
    // Chunk size warnings
    chunkSizeWarningLimit: 1e3,
    // 1MB warning threshold
    // CSS code splitting
    cssCodeSplit: true
  },
  // Otimização de dependências
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "date-fns/format",
      "date-fns/startOfMonth",
      "date-fns/endOfMonth",
      "date-fns/addMonths",
      "date-fns/subMonths"
    ],
    exclude: ["lucide-react"]
    // Tree-shake icons
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9WZXJzaXgvRmluYW5zaXgvZmluYW5zaXgtd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgIHNraXBXYWl0aW5nOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHR5cGU6ICdtb2R1bGUnLFxyXG4gICAgICB9LFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24ucG5nJywgJ2ljb25zLyoucG5nJ10sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ0ZpbmFuc2l4JyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnRmluYW5zaXgnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2VzdFx1MDBFM28gZmluYW5jZWlyYSBwZXNzb2FsIGUgZmFtaWxpYXInLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2Y4ZmFmYycsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMTM1QkVDJyxcclxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0LXByaW1hcnknLFxyXG4gICAgICAgIGxhbmc6ICdwdC1CUicsXHJcbiAgICAgICAgY2F0ZWdvcmllczogWydmaW5hbmNlJywgJ3Byb2R1Y3Rpdml0eSddLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ2ljb25zL2ljb24tNzJ4NzIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc3Mng3MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUgYW55J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnaWNvbnMvaWNvbi05Nng5Ni5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzk2eDk2JyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTE0NHgxNDQucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxNDR4MTQ0JyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBzY3JlZW5zaG90czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdzY3JlZW5zaG90cy9ob21lLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMzkweDg0NCcsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBmb3JtX2ZhY3RvcjogJ25hcnJvdycsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnVGVsYSBpbmljaWFsIGRvIEZpbmFuc2l4J1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2hvcnRjdXRzOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdOb3ZhIFRyYW5zYVx1MDBFN1x1MDBFM28nLFxyXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnTm92YScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWRpY2lvbmFyIG5vdmEgdHJhbnNhXHUwMEU3XHUwMEUzbycsXHJcbiAgICAgICAgICAgIHVybDogJy90cmFuc2FjdGlvbnMvbmV3JyxcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJ2ljb25zL3Nob3J0Y3V0LWFkZC5wbmcnLCBzaXplczogJzk2eDk2JywgdHlwZTogJ2ltYWdlL3BuZycgfV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdDYXJ0ZWlyYScsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdDYXJ0ZWlyYScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmVyIGNhcnRcdTAwRjVlcyBlIGNvbnRhcycsXHJcbiAgICAgICAgICAgIHVybDogJy93YWxsZXQnLFxyXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnaWNvbnMvc2hvcnRjdXQtd2FsbGV0LnBuZycsIHNpemVzOiAnOTZ4OTYnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSksXHJcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgLSBnZXJhIHN0YXRzLmh0bWxcclxuICAgIHZpc3VhbGl6ZXIoe1xyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgZ3ppcFNpemU6IHRydWUsXHJcbiAgICAgIGJyb3RsaVNpemU6IHRydWUsXHJcbiAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICB9KSBhcyBhbnksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiBmYWxzZSwgLy8gRGlzYWJsZSBzb3VyY2VtYXBzIGluIHByb2QgZm9yIHNtYWxsZXIgYnVuZGxlXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgJ21sLXZlbmRvcic6IFsnQHRlbnNvcmZsb3cvdGZqcyddLFxyXG4gICAgICAgICAgJ29jci12ZW5kb3InOiBbJ3Rlc3NlcmFjdC5qcyddLFxyXG4gICAgICAgICAgJ3BkZi12ZW5kb3InOiBbJ3BkZmpzLWRpc3QnXSxcclxuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAndWktdmVuZG9yJzogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1zbG90JywgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gTm9tZXMgZGUgYXJxdWl2byBjb20gaGFzaCBwYXJhIGNhY2hlIGJ1c3RpbmdcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIENvbXByZXNzXHUwMEUzbyBtXHUwMEUxeGltYVxyXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsIC8vIEZhc3RlciB0aGFuIHRlcnNlciwgZ29vZCBlbm91Z2ggZm9yIG1vc3QgY2FzZXMuIFxyXG4gICAgLy8gVXNlICd0ZXJzZXInIGlmIGJ1bmRsZSBzaXplIGlzIGFic29sdXRlbHkgY3JpdGljYWwgYW5kIGJ1aWxkIHRpbWUgaXMgc2Vjb25kYXJ5LlxyXG4gICAgXHJcbiAgICAvLyBDaHVuayBzaXplIHdhcm5pbmdzXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsIC8vIDFNQiB3YXJuaW5nIHRocmVzaG9sZFxyXG4gICAgXHJcbiAgICAvLyBDU1MgY29kZSBzcGxpdHRpbmdcclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIE90aW1pemFcdTAwRTdcdTAwRTNvIGRlIGRlcGVuZFx1MDBFQW5jaWFzXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxyXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgJ2RhdGUtZm5zL2Zvcm1hdCcsXHJcbiAgICAgICdkYXRlLWZucy9zdGFydE9mTW9udGgnLFxyXG4gICAgICAnZGF0ZS1mbnMvZW5kT2ZNb250aCcsXHJcbiAgICAgICdkYXRlLWZucy9hZGRNb250aHMnLFxyXG4gICAgICAnZGF0ZS1mbnMvc3ViTW9udGhzJyxcclxuICAgIF0sXHJcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLCAvLyBUcmVlLXNoYWtlIGljb25zXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVIsU0FBUyxvQkFBb0I7QUFDcFQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFKeEIsSUFBTSxt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
