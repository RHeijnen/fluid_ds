import { getIcon } from "./registry.js";

/**
 * Lazy-load an icon from the bundled lucide set. The first call for a given
 * name triggers a dynamic import; subsequent calls return the cached value.
 *
 * Import this API from `@fluid-ds/icons/load-icon` when bundle chunk count
 * matters. The regular registry entry point deliberately has no dependency on
 * the generated 1,500-icon manifest.
 */
export async function loadIcon(name: string): Promise<string> {
  const cached = getIcon(name);
  if (cached) return cached;

  const { LUCIDE_LOADERS } = await import("./lucide/_manifest.js");
  const loader = LUCIDE_LOADERS[name];
  if (!loader) {
    throw new Error(
      `loadIcon: no icon named "${name}" in the lucide set. ` +
        `See https://lucide.dev for available names (use kebab-case).`
    );
  }

  await loader();
  const svg = getIcon(name);
  if (!svg) throw new Error(`loadIcon: "${name}" did not register itself`);
  return svg;
}
