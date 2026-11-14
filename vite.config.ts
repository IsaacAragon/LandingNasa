import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesiumModule from "vite-plugin-cesium";

// vite-plugin-cesium is CJS; under "module": "nodenext" TS sees the module object.
type CesiumPlugin = typeof cesiumModule.default;
const cesium: CesiumPlugin =
  (cesiumModule as unknown as { default?: CesiumPlugin }).default ??
  (cesiumModule as unknown as CesiumPlugin);

export default defineConfig({
  plugins: [react(), cesium()],
});
