import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// SANNIDH Dev Server — Memory-Stable Config
export default defineConfig(({ mode }) => {

  return {
    cacheDir: "node_modules/.vite",
    server: {
      host: "0.0.0.0",
      port: 8000,
      strictPort: true,
      // Reduce filesystem poll overhead on every HMR tick
      fs: {
        cachedChecks: false,
      },
      watch: {
        // Use polling only when native events fail (ARM Mac stability)
        usePolling: false,
        ignored: [
          "**/node_modules/**",
          "**/node_modules.symlink/**",
          "**/.git/**",
          "**/dist/**",
          "**/supabase/**",
          "**/.env*",
          "**/.gemini/**",
          "**/brain/**",
          "**/.system_generated/**",
          "**/*.jsonl",
          "**/*.log",
          "**/coverage/**",
          "**/*.test.*",
          "**/*.spec.*",
        ],
      },
      // Only warmup the 3 critical auth files — warming up 13 files at startup
      // was consuming 400MB+ before the first page load.
      warmup: {
        clientFiles: [
          "./src/hooks/use-auth.tsx",
          "./src/lib/enhanced-auth-context.tsx",
          "./src/lib/lazyWithRetry.ts",
        ],
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: "es2020",
      minify: "esbuild",
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-toast",
              "@radix-ui/react-select",
              "@radix-ui/react-popover",
            ],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["framer-motion"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    optimizeDeps: {
      // holdUntilCrawlEnd: true prevents the blank-page reload loop.
      // With false, Vite force-reloads the page each time it discovers a new dep
      // from lazy imports — causing an infinite blank page loop.
      // With true, Vite scans deps once at startup and caches them all.
      // We prevent the OOM by pre-including all known heavy deps below.
      holdUntilCrawlEnd: true,
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "react-router-dom",
        "@tanstack/react-query",
        "@supabase/supabase-js",
        "framer-motion",
        "lucide-react",
        "date-fns",
        "zod",
        "zustand",
        "@sentry/react",
        "recharts",
        "react-hook-form",
        "@hookform/resolvers",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "sonner",
        "next-themes",
        "embla-carousel-react",
        "react-day-picker",
        "react-resizable-panels",
        "react-markdown",
        "remark-gfm",
        "vaul",
        "cmdk",
        "input-otp",
        "jspdf",
        "axios",
      ],
      // Exclude only truly incompatible libs (pdfjs uses web workers + binary assets)
      exclude: [
        "pdfjs-dist",
      ],
    },
  };
});
