import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        core: "src/core.ts",
      },
      formats: ["es"],
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
});
