import { css } from "lit";

/**
 * Shared motion foundation for Fluid components.
 *
 * `@keyframes` do NOT cross shadow boundaries, so the standard animation set
 * ships as a `css` fragment that each component spreads into its
 * `static styles` (it's adopted into that component's shadow root, where its
 * `animation-name` can then resolve the preset by name). This is what lets a
 * consumer swap one preset for another purely with a token:
 *
 *     animation-name: var(--fluid-dialog-enter-animation, fluid-scale-in);
 *     [data-fluid-brand="x"] fluid-dialog { --fluid-dialog-enter-animation: fluid-slide-in-up; }
 *
 * Opt out of motion three ways (all declarative):
 *   - per animation: `--fluid-<comp>-enter-animation: none`
 *   - globally / per subtree / per instance: set the inherited scalar
 *     `--fluid-motion: 0` (custom properties pierce shadow DOM). Components
 *     multiply their durations by it: `calc(<dur> * var(--fluid-motion, 1))`.
 *   - automatically: `prefers-reduced-motion: reduce` (see `reducedMotion`).
 *
 * Slide distance is `--fluid-motion-slide` (default 8px); a component can scale
 * it (e.g. a toast nudging in further) without redefining keyframes.
 */
export const motionStyles = css`
  @keyframes fluid-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes fluid-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes fluid-scale-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fluid-scale-out {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: scale(0.96);
    }
  }
  @keyframes fluid-slide-in-up {
    from {
      opacity: 0;
      transform: translateY(var(--fluid-motion-slide, 8px));
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fluid-slide-out-up {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: translateY(var(--fluid-motion-slide, 8px));
    }
  }
  @keyframes fluid-slide-in-down {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--fluid-motion-slide, 8px)));
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fluid-slide-out-down {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: translateY(calc(-1 * var(--fluid-motion-slide, 8px)));
    }
  }
  @keyframes fluid-slide-in-left {
    from {
      opacity: 0;
      transform: translateX(var(--fluid-motion-slide, 8px));
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fluid-slide-out-left {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: translateX(var(--fluid-motion-slide, 8px));
    }
  }
  @keyframes fluid-slide-in-right {
    from {
      opacity: 0;
      transform: translateX(calc(-1 * var(--fluid-motion-slide, 8px)));
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fluid-slide-out-right {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: translateX(calc(-1 * var(--fluid-motion-slide, 8px)));
    }
  }
  @keyframes fluid-backdrop-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes fluid-backdrop-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

/**
 * Drop-in `prefers-reduced-motion` guard. Add to a component's `static styles`
 * and any animation/transition inside its shadow root collapses to near-instant
 * when the user asks the OS to reduce motion. Scoped to the shadow root (the
 * `*` selector can't reach light-DOM/slotted content).
 */
export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    *,
    ::before,
    ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
