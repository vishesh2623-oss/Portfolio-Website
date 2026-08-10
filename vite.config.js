import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Prevents "chunk size" warnings from crashing the build
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Automatically splits large libraries into a separate "vendor" file
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});