import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
  },
  server: {
    port: 5500,
    open: true,
  },
});
