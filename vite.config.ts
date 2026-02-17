import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Simplified Vite config to avoid plugin issues
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === "development",
    minify: mode === "production" ? "terser" : "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-appwrite": ["appwrite"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    target: "esnext",
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "appwrite", "@tanstack/react-query"],
  },
  css: {
    devSourcemap: mode === 'development',
  },
}));
