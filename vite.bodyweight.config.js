import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const parent = process.env.BASE_PATH
  ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, "")}/`
  : "/";
const base = `${parent}bodyweight/`;
export default defineConfig({
  root: "bodyweight",
  base,
  build: { outDir: "../dist/bodyweight", emptyOutDir: true },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        id: base,
        name: "Away Strength",
        short_name: "Away Strength",
        description: "Three movements. Your own pace.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#080c16",
        theme_color: "#080c16",
        icons: [
          {
            src: `${base}icon-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${base}icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
    }),
  ],
});
