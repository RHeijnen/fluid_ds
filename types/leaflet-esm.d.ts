// Leaflet's ESM build (`leaflet/dist/leaflet-src.esm.js`) ships no type
// declarations of its own. @fluid-ds/map imports that build for runtime (the
// package "main" is a UMD bundle that yields an empty namespace under a native
// ESM loader). A `paths` entry in tsconfig.base.json maps that specifier to
// this file so every package that compiles the map source gets Leaflet's real
// types from the published `@types/leaflet`.
export * from "leaflet";
