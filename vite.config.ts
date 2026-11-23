import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      // `npm run dev:api` talks to the local Pages Functions + D1 started by `npm run cf:dev`.
      proxy: env.VITE_STORAGE === "api" ? { "/api": "http://localhost:8788" } : undefined,
    },
  };
});
