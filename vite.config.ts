import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;

  return {
    server: {
      host: "localhost",
      port: 8000,
      strictPort: false,
      watch: {
        ignored: ["**/node_modules/**", "**/node_modules.nosync/**", "**/.git/**", "**/dist/**", "**/supabase/**"],
      },
      hmr: {
        host: "localhost",
        port: 8000,
        overlay: false,
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
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "@supabase/supabase-js",
        "framer-motion",
      ],
    },
  };
});
