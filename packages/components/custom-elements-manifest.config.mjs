import { usesTokenPlugin } from "./cem-plugins/uses-token.mjs";
import { sortManifestPlugin } from "./cem-plugins/sort-manifest.mjs";

export default {
  globs: ["src/**/*.ts"],
  exclude: ["src/**/*.test.ts", "src/**/*.stories.ts"],
  litelement: true,
  packagejson: true,
  outdir: ".",
  // sort-manifest must run last so it reorders the fully-assembled manifest.
  plugins: [usesTokenPlugin(), sortManifestPlugin()]
};
