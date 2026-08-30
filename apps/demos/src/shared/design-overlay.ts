/**
 * Floating "Customize" overlay, the playground's design panel,
 * boiled down to the bits that make sense embedded inside a real
 * demo page.
 *
 * Mounts a fixed FAB in the bottom-right. Clicking it opens a
 * `<fluid-drawer>` containing a color-picker per key semantic token
 * (primary, the status tones, surface, text) and a "Reset" button
 * that clears every inline override we may have written. Brand and
 * scheme switching live in the shell header's theme picker, so the
 * drawer deliberately does not duplicate them.
 *
 * Writes inline `--fluid-*` styles directly on `document.documentElement`
 * so any descendant, including everything in the demo, re-renders
 * with the new tokens. Action-tone tokens come as a base/hover/active
 * trio; the drawer picks the base and derives the other two with
 * `color-mix`, so hovered and pressed states stay coherent.
 *
 * Why not just embed the full playground? The playground is a 100+ KB
 * editor app that owns its own URL state. The demos want something
 * lighter: a few sliders, one drawer, no router. Same theming primitive
 * underneath (CSS custom properties on the root) so the export from
 * the full playground stays compatible, anything edited here could
 * be loaded into the playground for finer control.
 */

const SEMANTIC_TOKENS: {
  name: string;
  cssVar: string;
  /** Base names whose -hover / -active shades are derived from the pick. */
  derives?: string;
}[] = [
  { name: "Primary", cssVar: "--fluid-accent-base", derives: "--fluid-accent" },
  { name: "Success", cssVar: "--fluid-success-base", derives: "--fluid-success" },
  { name: "Warning", cssVar: "--fluid-warning-base", derives: "--fluid-warning" },
  { name: "Danger", cssVar: "--fluid-danger-base", derives: "--fluid-danger" },
  { name: "Surface", cssVar: "--fluid-surface-base" },
  { name: "Text", cssVar: "--fluid-text-primary" }
];

/* v2: v1 stored overrides for token names that no longer exist
   (`--fluid-color-primary` and friends), so its state is abandoned. */
const STORAGE_KEY = "fluid-demos-design-overlay-v2";

interface PersistedState {
  overrides: Record<string, string>;
}

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overrides: {} };
    const parsed = JSON.parse(raw);
    return {
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {}
    };
  } catch {
    return { overrides: {} };
  }
}

function writeState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Mirror the current overrides onto `<html>`; they sit on top of whatever
 *  brand/scheme the header picker has applied. */
function applyToRoot(state: PersistedState): void {
  const root = document.documentElement;
  // Clear inline overrides first so dropped vars get removed.
  for (const t of SEMANTIC_TOKENS) {
    root.style.removeProperty(t.cssVar);
    if (t.derives) {
      root.style.removeProperty(`${t.derives}-hover`);
      root.style.removeProperty(`${t.derives}-active`);
    }
  }
  for (const t of SEMANTIC_TOKENS) {
    const value = state.overrides[t.cssVar];
    if (!value) continue;
    root.style.setProperty(t.cssVar, value);
    if (t.derives) {
      root.style.setProperty(`${t.derives}-hover`, `color-mix(in srgb, ${value} 85%, black)`);
      root.style.setProperty(`${t.derives}-active`, `color-mix(in srgb, ${value} 72%, black)`);
    }
  }
}

/**
 * Mount the FAB + drawer into `<body>`. Idempotent, re-calling returns
 * the existing nodes rather than stacking copies.
 */
export function mountDesignOverlay(): void {
  if (document.querySelector("#fluid-design-overlay-root")) return;

  const wrap = document.createElement("div");
  wrap.id = "fluid-design-overlay-root";

  // Inline styles for the FAB so the overlay works without leaning on
  // the demo's own stylesheet. The drawer's internals come from
  // `<fluid-drawer>`.
  const css = document.createElement("style");
  css.textContent = `
    .fluid-design-fab {
      all: unset;
      position: fixed;
      bottom: var(--fluid-space-5, 1.5rem);
      right: var(--fluid-space-5, 1.5rem);
      z-index: 40;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.1rem;
      border-radius: 999px;
      background: var(--fluid-accent-base, #6366f1);
      color: var(--fluid-accent-text, #ffffff);
      font-weight: 600;
      font-size: 0.875rem;
      font-family: var(--fluid-font-family-sans);
      box-shadow:
        0 8px 24px -8px color-mix(in srgb, var(--fluid-accent-base, #6366f1) 50%, transparent),
        0 2px 4px rgb(0 0 0 / 0.08);
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .fluid-design-fab:hover {
      transform: translateY(-1px);
      box-shadow:
        0 12px 32px -8px color-mix(in srgb, var(--fluid-accent-base, #6366f1) 60%, transparent),
        0 4px 8px rgb(0 0 0 / 0.1);
    }
    /* The drawer is narrow, so each token stacks: name + var on one line,
       the picker on its own full-width line below. */
    .fluid-design-row {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.4rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--fluid-border-default);
    }
    .fluid-design-row:last-child { border-bottom: 0; }
    .fluid-design-row > div {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .fluid-design-row label {
      font-size: 0.875rem;
      color: var(--fluid-text-primary);
    }
    .fluid-design-row code {
      font-family: var(--fluid-font-family-mono);
      font-size: 0.75rem;
      color: var(--fluid-text-secondary);
      white-space: nowrap;
    }
  `;
  wrap.appendChild(css);

  // FAB
  const fab = document.createElement("button");
  fab.className = "fluid-design-fab";
  fab.type = "button";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
    Customize
  `;
  wrap.appendChild(fab);

  // Drawer
  const drawer = document.createElement("fluid-drawer");
  drawer.setAttribute("placement", "end");
  drawer.setAttribute("aria-label", "Theme overlay");

  const initialState = readState();

  const tokenRows = SEMANTIC_TOKENS.map(
    (t) => `
    <div class="fluid-design-row">
      <div>
        <label for="ov-${t.cssVar.slice(2)}">${t.name}</label>
        <code>${t.cssVar}</code>
      </div>
      <fluid-color-picker
        id="ov-${t.cssVar.slice(2)}"
        data-token="${t.cssVar}"
        value="${initialState.overrides[t.cssVar] ?? ""}"
        aria-label="${t.name}"
      ></fluid-color-picker>
    </div>
  `
  ).join("");

  drawer.innerHTML = `
    <span slot="label">Customize theme</span>

    <p style="margin: 0 0 1rem; color: var(--fluid-text-secondary); font-size: 0.875rem;">
      Override the semantic tokens this page runs on; every
      <code style="font-family: var(--fluid-font-family-mono);">&lt;fluid-*&gt;</code>
      re-renders live. Brand and light/dark live in the header, and the
      <a href="/playground/">theme builder</a> offers the full editor.
    </p>

    <div style="font-size: 0.875rem; font-weight: 600; margin: 0.5rem 0 0;">
      Semantic tokens
    </div>
    ${tokenRows}

    <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <fluid-button variant="ghost" id="overlay-reset">Reset</fluid-button>
      <fluid-button id="overlay-close">Done</fluid-button>
    </div>
  `;
  wrap.appendChild(drawer);

  document.body.appendChild(wrap);

  // Behaviour
  const showDrawer = () => (drawer as unknown as { show?: () => void }).show?.();
  const hideDrawer = () => (drawer as unknown as { hide?: () => void }).hide?.();

  fab.addEventListener("click", () => showDrawer());

  drawer.querySelector("#overlay-close")?.addEventListener("click", () => hideDrawer());

  drawer
    .querySelectorAll<HTMLElement & { value?: string }>("fluid-color-picker[data-token]")
    .forEach((picker) => {
      picker.addEventListener("fluid-input", (e) => {
        const token = picker.getAttribute("data-token");
        if (!token) return;
        const value = (e as CustomEvent).detail.value as string;
        const state = readState();
        if (value) state.overrides[token] = value;
        else delete state.overrides[token];
        writeState(state);
        applyToRoot(state);
      });
    });

  drawer.querySelector("#overlay-reset")?.addEventListener("click", () => {
    const state: PersistedState = { overrides: {} };
    writeState(state);
    applyToRoot(state);
    // Reset the picker inputs visually so the drawer reflects the
    // wipe immediately.
    drawer
      .querySelectorAll<HTMLElement & { value?: string }>("fluid-color-picker[data-token]")
      .forEach((picker) => {
        picker.value = "";
      });
  });

  // Apply persisted state on first mount.
  applyToRoot(initialState);
}
