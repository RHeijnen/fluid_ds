export {
  registerIcon,
  registerIcons,
  getIcon,
  hasIcon,
  listIcons,
  onIconRegistered
} from "./registry.js";
export { loadIcon } from "./load-icon.js";

// Legacy hand-coded set, kept for backwards compatibility while consumers
// migrate to the lucide-based defaults. Importing `@fluid-ds/icons/register-defaults`
// now registers a curated subset of lucide instead of this map.
export { defaultIcons } from "./icons.js";

// The full lucide set is available via `@fluid-ds/icons/lucide/<name>` for
// side-effect imports, or via the lazy `loadIcon(name)` API for runtime
// registration. Import the complete name list from
// `@fluid-ds/icons/manifest` so registry-only consumers never traverse the
// generated dynamic-import graph.
