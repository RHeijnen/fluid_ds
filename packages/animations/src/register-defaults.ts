/**
 * Side-effect entry that registers the curated default animation set.
 * Importing this file registers all 12 common animations.
 *
 * If you only need a couple of them, skip this and import the individual
 * modules instead, they're tree-shakable:
 *
 * ```ts
 * import "@fluid-ds/animations/animations/fade-in";
 * import "@fluid-ds/animations/animations/slide-up";
 * ```
 *
 * Tree-shaking note: this file is tagged as `sideEffects: true` in
 * `package.json` so bundlers keep the registration calls. Individual
 * animation modules stay shakable when imported in isolation.
 */

// Reveals
import "./animations/fade-in.js";
import "./animations/fade-out.js";
import "./animations/slide-up.js";
import "./animations/slide-down.js";
import "./animations/slide-left.js";
import "./animations/slide-right.js";
import "./animations/scale-in.js";
import "./animations/zoom-in.js";

// Attention-getters
import "./animations/pulse.js";
import "./animations/shake.js";
import "./animations/bounce.js";
import "./animations/flash.js";

// Loaders
import "./animations/spin.js";
