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
  build: {
    // Warn when any individual chunk exceeds 500 kB (raw parse cost matters
    // on mobile CPUs — gzipped size is typically 3× smaller but parse happens
    // on the uncompressed JS).
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Function form: gives us a catch-all for every node_modules package,
        // not just the ones explicitly listed. New packages added in future
        // will automatically land in the right chunk.
        manualChunks(id: string) {
          // ── React core ──────────────────────────────────────────────────
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // ── React Router ─────────────────────────────────────────────────
          if (id.includes('/node_modules/react-router')) {
            return 'vendor-router';
          }

          // ── Supabase ──────────────────────────────────────────────────────
          if (id.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase';
          }

          // ── TanStack Query ────────────────────────────────────────────────
          if (id.includes('/node_modules/@tanstack/')) {
            return 'vendor-query';
          }

          // ── Radix UI (all packages in one chunk) ──────────────────────
          // Radix primitives heavily cross-import each other, so splitting
          // them causes circular-chunk warnings. One named chunk is optimal.
          if (id.includes('/node_modules/@radix-ui/') || id.includes('/node_modules/@radix-ui')) {
            return 'vendor-radix';
          }

          // ── Charts (only on Analytics/Admin pages) ────────────────────────
          if (
            id.includes('/node_modules/recharts/') ||
            id.includes('/node_modules/d3') ||
            id.includes('/node_modules/victory')
          ) {
            return 'vendor-charts';
          }

          // ── Date utilities ────────────────────────────────────────────────
          if (id.includes('/node_modules/date-fns/')) {
            return 'vendor-date';
          }

          // ── Embla carousel ────────────────────────────────────────────────
          if (id.includes('/node_modules/embla-carousel')) {
            return 'vendor-carousel';
          }

          // ── Form utilities ────────────────────────────────────────────────
          if (
            id.includes('/node_modules/react-hook-form/') ||
            id.includes('/node_modules/zod/') ||
            id.includes('/node_modules/@hookform/')
          ) {
            return 'vendor-forms';
          }

          // ── UI micro-libs (class name helpers + icons) ────────────────────
          if (
            id.includes('/node_modules/clsx/') ||
            id.includes('/node_modules/class-variance-authority/') ||
            id.includes('/node_modules/tailwind-merge/') ||
            id.includes('/node_modules/lucide-react/')
          ) {
            return 'vendor-ui-utils';
          }

          // ── Sonner (toast) + Vaul (drawer) ────────────────────────────────
          if (
            id.includes('/node_modules/sonner/') ||
            id.includes('/node_modules/vaul/')
          ) {
            return 'vendor-overlays';
          }

          // ── Web3 / Wallet (heavy — only on /wallet route) ─────────────────
          if (
            id.includes('/node_modules/@web3auth/') ||
            id.includes('/node_modules/viem/') ||
            id.includes('/node_modules/ethers/') ||
            id.includes('/node_modules/abitype/')
          ) {
            return 'vendor-web3';
          }
        },
      },
    },
  },
});
