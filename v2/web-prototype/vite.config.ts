import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// V2 web prototype. Dev server proxies /api to the real backend
// (uv run oe serve --port 8000) so swapping mock->real is a one-line flag.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
