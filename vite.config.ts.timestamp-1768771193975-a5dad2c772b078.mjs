// vite.config.ts
import { defineConfig } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.3_terser@5.44.1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.3_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///C:/Versix/Finansix/finansix-web/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@2.79.2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\Versix\\Finansix\\finansix-web";
var vite_config_default = defineConfig({
  plugins: [
    react(),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxWZXJzaXhcXFxcRmluYW5zaXhcXFxcZmluYW5zaXgtd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9WZXJzaXgvRmluYW5zaXgvZmluYW5zaXgtd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIC8vIEJ1bmRsZSBhbmFseXplciAtIGdlcmEgc3RhdHMuaHRtbFxyXG4gICAgdmlzdWFsaXplcih7XHJcbiAgICAgIG9wZW46IGZhbHNlLFxyXG4gICAgICBnemlwU2l6ZTogdHJ1ZSxcclxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcclxuICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgIH0pIGFzIGFueSxcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgaG9zdDogdHJ1ZSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLCAvLyBEaXNhYmxlIHNvdXJjZW1hcHMgaW4gcHJvZCBmb3Igc21hbGxlciBidW5kbGVcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgLy8gQ2h1bmtpbmcgc3RyYXRlZ3kgb3RpbWl6YWRvXHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICAvLyBDb3JlIFJlYWN0IC0gc2VtcHJlIHVzYWRvXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUm91dGVyIC0gc2VtcHJlIHVzYWRvXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncm91dGVyLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFRhblN0YWNrIFF1ZXJ5IC0gc2VtcHJlIHVzYWRvXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncXVlcnktdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gU3VwYWJhc2UgLSBzZW1wcmUgdXNhZG9cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdzdXBhYmFzZS12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBadXN0YW5kIC0gcGVxdWVubywgcG9kZSBmaWNhciBubyB2ZW5kb3JcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnenVzdGFuZCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnc3RhdGUtdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUmFkaXggVUkgLSBkaXZpZGlyIHBvciBjb21wb25lbnRlIHBhcmEgbGF6eSBsb2FkaW5nXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JhZGl4LWRpYWxvZyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC1kcm9wZG93bic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JhZGl4LXNlbGVjdCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1zd2l0Y2gnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JhZGl4LXN3aXRjaCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC10YWJzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC10YWJzJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC1vdGhlcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIERhdGUgdXRpbGl0aWVzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2RhdGUtZm5zJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdkYXRlLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEljb25zIC0gc2VwYXJhZG8gcG9pcyBcdTAwRTkgZ3JhbmRlXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnaWNvbnMtdmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQ2hhcnRzIC0gdXNhZG8gYXBlbmFzIGVtIGFuYWx5c2lzIHBhZ2VcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2NoYXJ0cy12ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBSZWFjdCBIb29rIEZvcm0gLSB1c2FkbyBlbSBmb3Jtc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1ob29rLWZvcm0nKSB8fCBpZC5pbmNsdWRlcygnQGhvb2tmb3JtJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdmb3JtLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFpvZCAtIHZhbGlkYVx1MDBFN1x1MDBFM29cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnem9kJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2YWxpZGF0aW9uLXZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIE91dHJhcyBsaWJzIGRvIG5vZGVfbW9kdWxlc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICAvLyBOb21lcyBkZSBhcnF1aXZvIGNvbSBoYXNoIHBhcmEgY2FjaGUgYnVzdGluZ1xyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8gQ29tcHJlc3NcdTAwRTNvIG1cdTAwRTF4aW1hXHJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUubG9ncyBlbSBwcm9kdVx1MDBFN1x1MDBFM29cclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLCAvLyBSZW1vdmUgZGVidWdnZXJzXHJcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLCAvLyBSZW1vdmUgZnVuXHUwMEU3XHUwMEY1ZXMgZXNwZWNcdTAwRURmaWNhc1xyXG4gICAgICB9LFxyXG4gICAgICBmb3JtYXQ6IHtcclxuICAgICAgICBjb21tZW50czogZmFsc2UsIC8vIFJlbW92ZSBjb21lbnRcdTAwRTFyaW9zXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyBDaHVuayBzaXplIHdhcm5pbmdzXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsIC8vIDFNQiB3YXJuaW5nIHRocmVzaG9sZFxyXG4gICAgXHJcbiAgICAvLyBDU1MgY29kZSBzcGxpdHRpbmdcclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIE90aW1pemFcdTAwRTdcdTAwRTNvIGRlIGRlcGVuZFx1MDBFQW5jaWFzXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxyXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgJ2RhdGUtZm5zL2Zvcm1hdCcsXHJcbiAgICAgICdkYXRlLWZucy9zdGFydE9mTW9udGgnLFxyXG4gICAgICAnZGF0ZS1mbnMvZW5kT2ZNb250aCcsXHJcbiAgICAgICdkYXRlLWZucy9hZGRNb250aHMnLFxyXG4gICAgICAnZGF0ZS1mbnMvc3ViTW9udGhzJyxcclxuICAgIF0sXHJcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLCAvLyBUcmVlLXNoYWtlIGljb25zXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVIsU0FBUyxvQkFBb0I7QUFDcFQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUgzQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLFdBQVc7QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxNQUNaLFVBQVU7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
