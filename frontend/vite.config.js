import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", //need this cuz vite only runs localhost, u need to add this so that the dev server listens to all network instances
    port: 5173,
  },
});
