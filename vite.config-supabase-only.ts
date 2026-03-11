import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Disable Convex for Supabase-only mode
    'process.env.CONVEX_DISABLED': 'true'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
