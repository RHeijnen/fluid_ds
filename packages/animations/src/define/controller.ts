/**
 * Side-effect entry that boots the global animation controller.
 *
 * Importing this file starts the singleton MutationObserver +
 * IntersectionObserver pair that drives all `data-fluid-animation`
 * attributes on the page. Safe to import multiple times (subsequent
 * calls are no-ops).
 *
 * Typical setup, paired with the defaults:
 *
 * ```html
 * <script type="module" src="@fluid-ds/animations/define/controller"></script>
 * <script type="module" src="@fluid-ds/animations/register-defaults"></script>
 *
 * <fluid-card data-fluid-animation="fade-in" data-fluid-animation-trigger="in-view">
 *   Fades in when it enters the viewport.
 * </fluid-card>
 * ```
 */
import { startAnimationController } from "../controller.js";

startAnimationController();
