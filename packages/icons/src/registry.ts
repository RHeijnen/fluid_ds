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
