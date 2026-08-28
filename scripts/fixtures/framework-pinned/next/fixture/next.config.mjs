/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the App Router pages emit plain HTML we can stage under
  // /demos/next/ in the unified website build.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.ADMIN_NEXT_BASE || undefined,
  // Workspace packages ship ESM / TS source (and Lit), so let Next transpile them.
  transpilePackages: [
    "@fluid-ds/components",
    "@fluid-ds/charts",
    "@fluid-ds/icons",
    "@fluid-ds/themes",
    "@fluid-ds/tokens",
    "lit"
  ],
  // The Fluid packages ship TS source that imports siblings with a `.js`
  // specifier (NodeNext style). Vite maps those to `.ts` automatically; webpack
  // needs to be told to try `.ts`/`.tsx` for a `.js` request.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"]
    };
    return config;
  }
};

export default nextConfig;
