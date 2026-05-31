/**
 * Icon registry.
 *
 * Components don't import icons directly; they ask the registry by name.
 * This lets consumers register their own icons under any name, override
 * defaults, or lazy-load on first use.
 */

const icons = new Map<string, string>();
const listeners = new Set<(name: string) => void>();

/**
 * Register an icon under a name. Overwrites if the name is already taken.
 * The SVG string MUST come from a trusted source, it's inserted into the DOM
 * via innerHTML.
 */
export function registerIcon(name: string, svg: string): void {
  icons.set(name, svg);
  for (const listener of listeners) listener(name);
}

/** Register a batch of icons at once. */
export function registerIcons(map: Record<string, string>): void {
  for (const [name, svg] of Object.entries(map)) registerIcon(name, svg);
}

/** Return the SVG string for an icon, or undefined if not registered. */
export function getIcon(name: string): string | undefined {
  return icons.get(name);
}

/** True if an icon with this name has been registered. */
export function hasIcon(name: string): boolean {
  return icons.has(name);
}

/** All registered icon names. Order is registration order. */
export function listIcons(): string[] {
  return Array.from(icons.keys());
}

/**
 * Subscribe to registration events. Returns an unsubscribe function.
 * Components can use this to re-render when their icon arrives late.
 */
export function onIconRegistered(listener: (name: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Lazy-load an icon from the bundled lucide set. The first call for a given
 * name triggers a dynamic import; subsequent calls return the cached value.
 *
 * Use this when you need an icon that wasn't pre-registered by
 * `register-defaults` and you don't want to import the lucide module by hand:
 *
 * ```ts
 * await loadIcon("rocket");
 * // <fluid-icon name="rocket"> now works
 * ```
 *
 * Throws if the name isn't in the lucide set (i.e. you typo'd).
 */
export async function loadIcon(name: string): Promise<string> {
  const cached = icons.get(name);
  if (cached) return cached;
  // Lazy-import the manifest so consumers who never call loadIcon don't pay
  // for it. The manifest is small, just a name → loader map.
  const { LUCIDE_LOADERS } = await import("./lucide/_manifest.js");
  const loader = LUCIDE_LOADERS[name];
  if (!loader) {
    throw new Error(
      `loadIcon: no icon named "${name}" in the lucide set. ` +
        `See https://lucide.dev for available names (use kebab-case).`
    );
  }
  // The icon module is a side-effect import that calls registerIcon for us.
  await loader();
  const svg = icons.get(name);
  if (!svg) {
    // Should never happen, the module's side effect registers under the
    // same name. If we get here the build script is buggy.
    throw new Error(`loadIcon: "${name}" did not register itself`);
  }
  return svg;
}
