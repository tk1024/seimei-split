import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function spa404Plugin(): Plugin {
  return {
    name: "spa-404",
    closeBundle() {
      const outDir = resolve(__dirname, "../docs");
      const index = readFileSync(resolve(outDir, "index.html"), "utf-8");
      writeFileSync(resolve(outDir, "404.html"), index);
      // Ensure .nojekyll exists for GitHub Pages
      writeFileSync(resolve(outDir, ".nojekyll"), "");
    },
  };
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss(), spa404Plugin()],
  base: "/seimei-split/",
  build: {
    outDir: "../docs",
    emptyOutDir: false,
  },
});
