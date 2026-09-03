import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // react-promise-suspense is linked via `file:..`. Keeping the symlinked
  // node_modules path lets Vite apply its normal dependency handling
  // (pre-bundling and CommonJS interop) instead of treating it as app source.
  resolve: { preserveSymlinks: true },
});
