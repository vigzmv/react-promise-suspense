import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // react-promise-suspense is linked via `file:..`, so it lives outside
  // node_modules. Force Vite to pre-bundle it and run the CommonJS interop so
  // `import usePromise from ...` resolves the `module.exports = usePromise`
  // default. Consumers installing from npm get this for free.
  optimizeDeps: {
    include: ["react-promise-suspense"],
  },
  build: {
    commonjsOptions: {
      include: [/react-promise-suspense/, /node_modules/],
      defaultIsModuleExports: true,
    },
  },
});
