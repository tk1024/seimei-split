import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "seimeiSplitCore",
      formats: ["es", "cjs"],
      fileName: "index",
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
});
