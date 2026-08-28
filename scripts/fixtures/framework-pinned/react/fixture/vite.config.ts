import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.ADMIN_REACT_BASE || "/",
  build: { rollupOptions: { input: { main: "index.html", contract: "contract.html" } } },
  server: { port: 5191 }
});
