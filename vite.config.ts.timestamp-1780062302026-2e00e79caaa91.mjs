// vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/atharavsingh/Desktop/Regulon%20real/regulon-command/node_modules/vite/dist/node/index.js";
import react from "file:///Users/atharavsingh/Desktop/Regulon%20real/regulon-command/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///Users/atharavsingh/Desktop/Regulon%20real/regulon-command/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/atharavsingh/Desktop/Regulon real/regulon-command";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  return {
    server: {
      host: "::",
      port: 8e3,
      hmr: {
        overlay: false
      },
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false
        },
        "/agent": {
          target: "http://localhost:8787",
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2.replace(/^\/agent/, "")
        },
        ...supabaseUrl ? {
          "/api/ai-draft": {
            target: supabaseUrl,
            changeOrigin: true,
            secure: true,
            rewrite: () => "/functions/v1/ai-draft"
          }
        } : {}
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      // Performance optimizations
      target: "es2020",
      minify: "esbuild",
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-toast",
              "@radix-ui/react-select",
              "@radix-ui/react-popover"
            ],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["framer-motion"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"]
          }
        }
      },
      // Increase chunk size warning limit (we're optimizing, but some chunks are legitimately large)
      chunkSizeWarningLimit: 800
    },
    // Optimize dependency pre-bundling
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "@supabase/supabase-js",
        "framer-motion"
      ]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYXRoYXJhdnNpbmdoL0Rlc2t0b3AvUmVndWxvbiByZWFsL3JlZ3Vsb24tY29tbWFuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2F0aGFyYXZzaW5naC9EZXNrdG9wL1JlZ3Vsb24gcmVhbC9yZWd1bG9uLWNvbW1hbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2F0aGFyYXZzaW5naC9EZXNrdG9wL1JlZ3Vsb24lMjByZWFsL3JlZ3Vsb24tY29tbWFuZC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xuICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5WSVRFX1NVUEFCQVNFX1VSTDtcblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODAwMCxcbiAgICAgIGhtcjoge1xuICAgICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBwcm94eToge1xuICAgICAgICBcIi9hcGlcIjoge1xuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgXCIvYWdlbnRcIjoge1xuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0Ojg3ODdcIixcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYWdlbnQvLCBcIlwiKSxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uKHN1cGFiYXNlVXJsXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIFwiL2FwaS9haS1kcmFmdFwiOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBzdXBhYmFzZVVybCxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJld3JpdGU6ICgpID0+IFwiL2Z1bmN0aW9ucy92MS9haS1kcmFmdFwiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDoge30pLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgLy8gUGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uc1xuICAgICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxuICAgICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAvLyBNYW51YWwgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgICAgXCJ2ZW5kb3ItcmVhY3RcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgICAgXCJ2ZW5kb3ItdWlcIjogW1xuICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxuICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10YWJzXCIsXG4gICAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXBcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9hc3RcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXG4gICAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIixcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcInZlbmRvci1xdWVyeVwiOiBbXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXG4gICAgICAgICAgICBcInZlbmRvci1zdXBhYmFzZVwiOiBbXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIl0sXG4gICAgICAgICAgICBcInZlbmRvci1jaGFydHNcIjogW1wicmVjaGFydHNcIl0sXG4gICAgICAgICAgICBcInZlbmRvci1tb3Rpb25cIjogW1wiZnJhbWVyLW1vdGlvblwiXSxcbiAgICAgICAgICAgIFwidmVuZG9yLWZvcm1zXCI6IFtcInJlYWN0LWhvb2stZm9ybVwiLCBcIkBob29rZm9ybS9yZXNvbHZlcnNcIiwgXCJ6b2RcIl0sXG4gICAgICAgICAgICBcInZlbmRvci11dGlsc1wiOiBbXCJkYXRlLWZuc1wiLCBcImNsc3hcIiwgXCJ0YWlsd2luZC1tZXJnZVwiLCBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdCAod2UncmUgb3B0aW1pemluZywgYnV0IHNvbWUgY2h1bmtzIGFyZSBsZWdpdGltYXRlbHkgbGFyZ2UpXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDgwMCxcbiAgICB9LFxuICAgIC8vIE9wdGltaXplIGRlcGVuZGVuY3kgcHJlLWJ1bmRsaW5nXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgIFwicmVhY3RcIixcbiAgICAgICAgXCJyZWFjdC1kb21cIixcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gICAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXG4gICAgICAgIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIsXG4gICAgICAgIFwiZnJhbWVyLW1vdGlvblwiLFxuICAgICAgXSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRWLFNBQVMsY0FBYyxlQUFlO0FBQ2xZLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sY0FBYyxJQUFJO0FBRXhCLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLFFBQ0EsVUFBVTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsWUFBWSxFQUFFO0FBQUEsUUFDaEQ7QUFBQSxRQUNBLEdBQUksY0FDQTtBQUFBLFVBQ0UsaUJBQWlCO0FBQUEsWUFDZixRQUFRO0FBQUEsWUFDUixjQUFjO0FBQUEsWUFDZCxRQUFRO0FBQUEsWUFDUixTQUFTLE1BQU07QUFBQSxVQUNqQjtBQUFBLFFBQ0YsSUFDQSxDQUFDO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUM5RSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVcsU0FBUztBQUFBLE1BQ3BCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQTtBQUFBLFVBRU4sY0FBYztBQUFBO0FBQUEsWUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsWUFDekQsYUFBYTtBQUFBLGNBQ1g7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNGO0FBQUEsWUFDQSxnQkFBZ0IsQ0FBQyx1QkFBdUI7QUFBQSxZQUN4QyxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQSxZQUMzQyxpQkFBaUIsQ0FBQyxVQUFVO0FBQUEsWUFDNUIsaUJBQWlCLENBQUMsZUFBZTtBQUFBLFlBQ2pDLGdCQUFnQixDQUFDLG1CQUFtQix1QkFBdUIsS0FBSztBQUFBLFlBQ2hFLGdCQUFnQixDQUFDLFlBQVksUUFBUSxrQkFBa0IsMEJBQTBCO0FBQUEsVUFDbkY7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBO0FBQUEsSUFFQSxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
