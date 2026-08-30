# Fluid on Android

Fluid is a web-component design system, so its cross-platform story on Android
is the web platform itself. Two supported routes, in order of effort:

## 1. Installable web app (works today)

The demos app (`apps/demos`) ships a web app manifest
(`public/manifest.webmanifest`, linked from every page) with maskable icons
and a standalone display mode. On Android, Chrome offers "Install app" /
"Add to home screen" for it; the installed app opens fullscreen with the
Fluid brand color as its chrome, indistinguishable in daily use from a
store-installed WebView app. Any app a consumer builds from Fluid components
gets the same for the cost of a manifest.

Verified here: the manifest parses, resolves its icons at both the dev root
and the unified `/demos/` mount (all URLs inside a manifest resolve against
the manifest's own URL), and the pages advertise it with a matching
`theme-color`.

## 2. Native wrap with Capacitor (needs the Android SDK)

For a Play-Store artifact, wrap the same build with Capacitor. The recipe,
from a machine with Android Studio (or the SDK + JDK 17) installed:

```bash
cd apps/demos
corepack pnpm exec vite build
npm i -D @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Fluid Demos" "dev.fluidweb.demos" --web-dir dist
npx cap add android
npx cap sync android
npx cap open android   # builds / signs / runs from Android Studio
```

Capacitor serves the built `dist/` from an embedded WebView with full custom
elements support (Android System WebView is Chromium), so every Fluid
component, theme, and animation runs unchanged. Native APIs (camera, share,
haptics) become available to the same codebase through Capacitor plugins.

This repository does not commit the generated `android/` Gradle project:
none of the maintainer machines currently carry the Android SDK, and an
unbuildable, unverifiable Gradle tree would rot. The recipe above generates
it deterministically in a few minutes when needed.

## Status

- Manifest + icons: shipped in `apps/demos` (this document's route 1).
- Capacitor project: documented, not committed (route 2); pick it up when an
  Android SDK machine is available.
