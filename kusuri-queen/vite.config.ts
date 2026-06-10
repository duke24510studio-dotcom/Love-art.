import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative base so the build works on any host path,
  // including the GitHub Pages project subpath.
  base: "./",
  plugins: [react(), tailwindcss()],
});
