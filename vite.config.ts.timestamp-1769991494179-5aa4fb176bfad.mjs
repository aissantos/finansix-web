// vite.config.ts
import { defineConfig } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.3_terser@5.44.1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.3_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@2.79.2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { VitePWA } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/vite-plugin-pwa@0.19.8_vite@5.4.21_@types+node@22.19.3_terser@5.44.1__workbox-build@7.4.0_@ty_spov7sqie7ks2u43vsvtnv47ua/node_modules/vite-plugin-pwa/dist/index.js";
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
        // Chunking strategy otimizado
        manualChunks(id) {
          if (id.includes("react") || id.includes("react-dom")) {
            return "react-vendor";
          }
          if (id.includes("react-router")) {
            return "router-vendor";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query-vendor";
          }
          if (id.includes("@supabase/supabase-js")) {
            return "supabase-vendor";
          }
          if (id.includes("zustand")) {
            return "state-vendor";
          }
          if (id.includes("@radix-ui/react-dialog")) {
            return "radix-dialog";
          }
          if (id.includes("@radix-ui/react-dropdown-menu")) {
            return "radix-dropdown";
          }
          if (id.includes("@radix-ui/react-select")) {
            return "radix-select";
          }
          if (id.includes("@radix-ui/react-switch")) {
            return "radix-switch";
          }
          if (id.includes("@radix-ui/react-tabs")) {
            return "radix-tabs";
          }
          if (id.includes("@radix-ui")) {
            return "radix-other";
          }
          if (id.includes("date-fns")) {
            return "date-vendor";
          }
          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }
          if (id.includes("recharts")) {
            return "charts-vendor";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform")) {
            return "form-vendor";
          }
          if (id.includes("zod")) {
            return "validation-vendor";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Compressão máxima
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.logs em produção
        drop_debugger: true,
        // Remove debuggers
        pure_funcs: ["console.log", "console.info", "console.debug"]
        // Remove funções específicas
      },
      format: {
        comments: false
        // Remove comentários
      }
    },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9WZXJzaXgvRmluYW5zaXgvZmluYW5zaXgtd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgIHNraXBXYWl0aW5nOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHR5cGU6ICdtb2R1bGUnLFxyXG4gICAgICB9LFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24ucG5nJywgJ2ljb25zLyoucG5nJ10sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ0ZpbmFuc2l4JyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnRmluYW5zaXgnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2VzdFx1MDBFM28gZmluYW5jZWlyYSBwZXNzb2FsIGUgZmFtaWxpYXInLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2Y4ZmFmYycsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMTM1QkVDJyxcclxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0LXByaW1hcnknLFxyXG4gICAgICAgIGxhbmc6ICdwdC1CUicsXHJcbiAgICAgICAgY2F0ZWdvcmllczogWydmaW5hbmNlJywgJ3Byb2R1Y3Rpdml0eSddLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ2ljb25zL2ljb24tNzJ4NzIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc3Mng3MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUgYW55J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnaWNvbnMvaWNvbi05Nng5Ni5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzk2eDk2JyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTE0NHgxNDQucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxNDR4MTQ0JyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSBhbnknXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBzY3JlZW5zaG90czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdzY3JlZW5zaG90cy9ob21lLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMzkweDg0NCcsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBmb3JtX2ZhY3RvcjogJ25hcnJvdycsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnVGVsYSBpbmljaWFsIGRvIEZpbmFuc2l4J1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2hvcnRjdXRzOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdOb3ZhIFRyYW5zYVx1MDBFN1x1MDBFM28nLFxyXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnTm92YScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWRpY2lvbmFyIG5vdmEgdHJhbnNhXHUwMEU3XHUwMEUzbycsXHJcbiAgICAgICAgICAgIHVybDogJy90cmFuc2FjdGlvbnMvbmV3JyxcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJ2ljb25zL3Nob3J0Y3V0LWFkZC5wbmcnLCBzaXplczogJzk2eDk2JywgdHlwZTogJ2ltYWdlL3BuZycgfV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdDYXJ0ZWlyYScsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdDYXJ0ZWlyYScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmVyIGNhcnRcdTAwRjVlcyBlIGNvbnRhcycsXHJcbiAgICAgICAgICAgIHVybDogJy93YWxsZXQnLFxyXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnaWNvbnMvc2hvcnRjdXQtd2FsbGV0LnBuZycsIHNpemVzOiAnOTZ4OTYnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSksXHJcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgLSBnZXJhIHN0YXRzLmh0bWxcclxuICAgIHZpc3VhbGl6ZXIoe1xyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgZ3ppcFNpemU6IHRydWUsXHJcbiAgICAgIGJyb3RsaVNpemU6IHRydWUsXHJcbiAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICB9KSBhcyBhbnksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiBmYWxzZSwgLy8gRGlzYWJsZSBzb3VyY2VtYXBzIGluIHByb2QgZm9yIHNtYWxsZXIgYnVuZGxlXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIC8vIENodW5raW5nIHN0cmF0ZWd5IG90aW1pemFkb1xyXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xyXG4gICAgICAgICAgLy8gQ29yZSBSZWFjdCAtIHNlbXByZSB1c2Fkb1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFJvdXRlciAtIHNlbXByZSB1c2Fkb1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1yb3V0ZXInKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JvdXRlci12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBUYW5TdGFjayBRdWVyeSAtIHNlbXByZSB1c2Fkb1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAdGFuc3RhY2svcmVhY3QtcXVlcnknKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3F1ZXJ5LXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFN1cGFiYXNlIC0gc2VtcHJlIHVzYWRvXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnc3VwYWJhc2UtdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gWnVzdGFuZCAtIHBlcXVlbm8sIHBvZGUgZmljYXIgbm8gdmVuZG9yXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3p1c3RhbmQnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3N0YXRlLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFJhZGl4IFVJIC0gZGl2aWRpciBwb3IgY29tcG9uZW50ZSBwYXJhIGxhenkgbG9hZGluZ1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC1kaWFsb2cnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncmFkaXgtZHJvcGRvd24nO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC1zZWxlY3QnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3Qtc3dpdGNoJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC1zd2l0Y2gnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtdGFicycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncmFkaXgtdGFicyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncmFkaXgtb3RoZXInO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBEYXRlIHV0aWxpdGllc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnZGF0ZS12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBJY29ucyAtIHNlcGFyYWRvIHBvaXMgXHUwMEU5IGdyYW5kZVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2ljb25zLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIENoYXJ0cyAtIHVzYWRvIGFwZW5hcyBlbSBhbmFseXNpcyBwYWdlXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdjaGFydHMtdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUmVhY3QgSG9vayBGb3JtIC0gdXNhZG8gZW0gZm9ybXNcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtaG9vay1mb3JtJykgfHwgaWQuaW5jbHVkZXMoJ0Bob29rZm9ybScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnZm9ybS12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBab2QgLSB2YWxpZGFcdTAwRTdcdTAwRTNvXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3pvZCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmFsaWRhdGlvbi12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBPdXRyYXMgbGlicyBkbyBub2RlX21vZHVsZXNcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gTm9tZXMgZGUgYXJxdWl2byBjb20gaGFzaCBwYXJhIGNhY2hlIGJ1c3RpbmdcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIENvbXByZXNzXHUwMEUzbyBtXHUwMEUxeGltYVxyXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcclxuICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgY29tcHJlc3M6IHtcclxuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsIC8vIFJlbW92ZSBjb25zb2xlLmxvZ3MgZW0gcHJvZHVcdTAwRTdcdTAwRTNvXHJcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSwgLy8gUmVtb3ZlIGRlYnVnZ2Vyc1xyXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSwgLy8gUmVtb3ZlIGZ1blx1MDBFN1x1MDBGNWVzIGVzcGVjXHUwMEVEZmljYXNcclxuICAgICAgfSxcclxuICAgICAgZm9ybWF0OiB7XHJcbiAgICAgICAgY29tbWVudHM6IGZhbHNlLCAvLyBSZW1vdmUgY29tZW50XHUwMEUxcmlvc1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8gQ2h1bmsgc2l6ZSB3YXJuaW5nc1xyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyAxTUIgd2FybmluZyB0aHJlc2hvbGRcclxuICAgIFxyXG4gICAgLy8gQ1NTIGNvZGUgc3BsaXR0aW5nXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgfSxcclxuICBcclxuICAvLyBPdGltaXphXHUwMEU3XHUwMEUzbyBkZSBkZXBlbmRcdTAwRUFuY2lhc1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICAncmVhY3QnLFxyXG4gICAgICAncmVhY3QtZG9tJyxcclxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxyXG4gICAgICAnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JyxcclxuICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsXHJcbiAgICAgICdkYXRlLWZucy9mb3JtYXQnLFxyXG4gICAgICAnZGF0ZS1mbnMvc3RhcnRPZk1vbnRoJyxcclxuICAgICAgJ2RhdGUtZm5zL2VuZE9mTW9udGgnLFxyXG4gICAgICAnZGF0ZS1mbnMvYWRkTW9udGhzJyxcclxuICAgICAgJ2RhdGUtZm5zL3N1Yk1vbnRocycsXHJcbiAgICBdLFxyXG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSwgLy8gVHJlZS1zaGFrZSBpY29uc1xyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVSLFNBQVMsb0JBQW9CO0FBQ3BULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFNBQVM7QUFBQSxRQUNQLHVCQUF1QjtBQUFBLFFBQ3ZCLGNBQWM7QUFBQSxRQUNkLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQSxZQUFZ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
