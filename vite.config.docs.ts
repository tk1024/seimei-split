import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "seimei-split.js",
    },
    outDir: "docs",
    emptyOutDir: false,
  },
});
