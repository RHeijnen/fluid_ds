/**
 * Resume support: mirror the wizard's full state (navigation + config + token
 * diff) into the URL hash and localStorage so a refresh or a shared link reopens
 * the wizard exactly where it was. The token diff uses the same shape the Theme
 * Builder exports, so the two stay format-compatible.
 */
import { themeStore } from "./theme-store.js";
import { wizardStore, STEPS, type Step, type WizardConfig } from "./wizard-store.js";

const KEY = "fluid-wizard-state";
const HASH = "w";

interface Persisted {
  s: Step;
  c: WizardConfig;
  t: Record<string, string>;
}

function encode(state: Persisted): string {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}
function decode(raw: string): Persisted | null {
  try {
    const obj = JSON.parse(decodeURIComponent(atob(raw)));
    if (obj && typeof obj === "object" && obj.c && obj.s) return obj as Persisted;
  } catch {
    /* malformed, ignore */
  }
  return null;
}

function readHash(): string | null {
  const m = new RegExp(`[#&]${HASH}=([^&]+)`).exec(location.hash);
  return m?.[1] ?? null;
}

/** Restore once (hash wins over localStorage), then auto-save on every change. */
export function initPersistence(): void {
  const restore = decode(readHash() ?? "") ?? decode(localStorage.getItem(KEY) ?? "");
  if (restore) {
    themeStore.replace(restore.t ?? {});
    wizardStore.setConfig(restore.c);
    if (STEPS.includes(restore.s)) wizardStore.setStep(restore.s);
  }

  let raf = 0;
  const save = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const state: Persisted = {
        s: wizardStore.get().step,
        c: wizardStore.get().config,
        t: themeStore.diff()
      };
      const enc = encode(state);
      try {
        localStorage.setItem(KEY, enc);
      } catch {
        /* private mode, ignore */
      }
      history.replaceState(null, "", `#${HASH}=${enc}`);
    });
  };

  wizardStore.subscribe(save);
  themeStore.subscribe(save);
}
