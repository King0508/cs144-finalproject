import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: {
        name: "Restored Church Campus Ministry",
        short_name: "RC Ministry",
        description: "Restored Church campus ministry: bible-talk chat, study scheduling, and curriculum-aware calendar.",
        theme_color: "#f4f7fb",
        background_color: "#f4f7fb",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: { enabled: false, type: "module" },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
    }),
  ],
  server: {
    port: 5173,
    // Dual-stack bind (IPv4 + IPv6). Prevents stray IPv6 listeners from
    // shadowing the dev server on Windows, where `localhost` resolves to
    // [::1] first.
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
