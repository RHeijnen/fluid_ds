/**
 * Side-effect entry that pre-registers a curated default set of icons.
 * Importing this file calls `registerIcon` for ~50 commonly-needed icons:
 * the ones Fluid components reference internally (chevrons, close,
 * search, check, eye, undo, alerts, etc.) plus a generous batch of common
 * UI actions (copy, download, upload, share, edit, trash, plus, minus, etc.).
 *
 * If you don't want the whole batch, skip this import and either:
 *   - import individual lucide icons:  `import "@fluid-ds/icons/lucide/check";`
 *   - or call `await loadIcon("check")` from a runtime caller.
 *
 * Tree-shaking note: this file is tagged as `sideEffects: true` in package.json
 * so bundlers keep the registration calls. The unused individual lucide modules
 * stay shakable.
 */

// Chevrons + navigation
import "./lucide/chevron-down.js";
import "./lucide/chevron-up.js";
import "./lucide/chevron-left.js";
import "./lucide/chevron-right.js";
import "./lucide/arrow-left.js";
import "./lucide/arrow-right.js";
import "./lucide/arrow-up.js";
import "./lucide/arrow-down.js";

// State / status
import "./lucide/check.js";
import "./lucide/x.js";
import "./lucide/info.js";
import "./lucide/circle-alert.js";
import "./lucide/triangle-alert.js";
import "./lucide/circle-check.js";
import "./lucide/circle-x.js";
import "./lucide/circle-help.js";
import "./lucide/loader.js";
import "./lucide/loader-circle.js";

// Visibility / search
import "./lucide/eye.js";
import "./lucide/eye-off.js";
import "./lucide/search.js";
import "./lucide/filter.js";
import "./lucide/menu.js";
import "./lucide/ellipsis.js";
import "./lucide/ellipsis-vertical.js";

// Actions
import "./lucide/copy.js";
import "./lucide/clipboard.js";
import "./lucide/download.js";
import "./lucide/upload.js";
import "./lucide/share.js";
import "./lucide/share-2.js";
import "./lucide/external-link.js";
import "./lucide/link.js";
import "./lucide/save.js";
import "./lucide/refresh-cw.js";
import "./lucide/undo.js";
import "./lucide/redo.js";

// CRUD
import "./lucide/pencil.js";
import "./lucide/trash.js";
import "./lucide/trash-2.js";
import "./lucide/plus.js";
import "./lucide/minus.js";

// Common nouns
import "./lucide/user.js";
import "./lucide/users.js";
import "./lucide/settings.js";
import "./lucide/house.js";
import "./lucide/bell.js";
import "./lucide/calendar.js";
import "./lucide/star.js";
import "./lucide/heart.js";

// Aliases, keep existing legacy names that components already reference,
// since renaming would force every importer to update. We register the
// alias by importing the underlying module and copy-registering.
import { registerIcon, getIcon } from "./registry.js";

// Lucide replaced these names; map our old keys to the new icons so existing
// component code keeps working.
const ALIASES: Record<string, string> = {
  // historical name → current lucide name
  "alert-triangle": "triangle-alert",
  "more-horizontal": "ellipsis",
  close: "x"
};

for (const [alias, target] of Object.entries(ALIASES)) {
  const svg = getIcon(target);
  if (svg) registerIcon(alias, svg);
}
