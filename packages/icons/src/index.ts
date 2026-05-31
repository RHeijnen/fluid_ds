export {
  registerIcon,
  registerIcons,
  getIcon,
  hasIcon,
  listIcons,
  onIconRegistered,
  loadIcon
} from "./registry.js";

// Legacy hand-coded set, kept for backwards compatibility while consumers
// migrate to the lucide-based defaults. Importing `@fluid-ds/icons/register-defaults`
// now registers a curated subset of lucide instead of this map.
export { defaultIcons } from "./icons.js";

// The full lucide set is available via `@fluid-ds/icons/lucide/<name>` for
// side-effect imports, or via the lazy `loadIcon(name)` API for runtime
// registration. The complete name list is also exported here for tooling
// (e.g. an icon-picker UI).
export { LUCIDE_NAMES } from "./lucide/_manifest.js";
