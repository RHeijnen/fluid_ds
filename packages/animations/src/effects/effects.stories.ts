import type { Meta, StoryObj } from "@storybook/web-components";

import {
  confetti,
  fireworks,
  emojiBurst,
  emojiRain,
  snow,
  sparkles,
  streamers,
  pulse,
  stars,
  hearts,
  pride,
  type EffectHandle
} from "./index.js";
import "../define/celebrate.js";

/**
 * The effects API is imperative, so the gallery is a grid of buttons that
 * fire each effect on click. Ambient effects (snow, sparkles, emoji rain)
 * toggle: click once to start, click again to stop.
 */
const meta: Meta = {
  title: "Animations/Effects",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" },
    docs: {
      description: {
        component:
          "Imperative canvas celebration effects from @fluid-ds/animations/effects. " +
          "Click a button to fire. All effects honor prefers-reduced-motion."
      }
    }
  }
};

export default meta;
type Story = StoryObj;

interface ButtonSpec {
  label: string;
  fire: (origin: HTMLElement) => EffectHandle;
  ambient?: boolean;
}

const oneShot: ButtonSpec[] = [
  { label: "🎉 Confetti", fire: (o) => confetti({ origin: o }) },
  { label: "🎆 Confetti cannons", fire: () => confetti({ cannons: true }) },
  { label: "🎇 Fireworks", fire: () => fireworks() },
  { label: "😄 Emoji burst", fire: (o) => emojiBurst({ origin: o }) },
  { label: "🎀 Streamers", fire: (o) => streamers({ origin: o }) },
  { label: "💥 Pulse", fire: (o) => pulse({ origin: o }) },
  { label: "⭐ Stars", fire: (o) => stars({ origin: o }) },
  { label: "❤️ Hearts", fire: (o) => hearts({ origin: o }) },
  { label: "🏳️‍🌈 Pride", fire: () => pride() }
];

const ambient: ButtonSpec[] = [
  { label: "❄️ Snow", fire: () => snow(), ambient: true },
  { label: "🌧️ Emoji rain", fire: () => emojiRain(), ambient: true },
  { label: "✨ Sparkles", fire: (o) => sparkles({ origin: o }), ambient: true }
];

function makeButton(spec: ButtonSpec): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = spec.label;
  btn.style.cssText =
    "padding:.6rem 1rem;border-radius:.5rem;border:1px solid var(--fluid-border-base,#d4d4d8);" +
    "background:var(--fluid-surface-raised,#fff);color:var(--fluid-text-base,#18181b);" +
    "font:inherit;cursor:pointer;";
  let handle: EffectHandle | undefined;
  btn.addEventListener("click", () => {
    if (spec.ambient && handle) {
      handle.stop();
      handle = undefined;
      btn.dataset["running"] = "";
      return;
    }
    handle = spec.fire(btn);
    if (spec.ambient) {
      btn.dataset["running"] = "1";
      void handle.finished.then(() => {
        handle = undefined;
      });
    }
  });
  return btn;
}

function gallery(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "display:flex;flex-wrap:wrap;gap:.75rem;max-width:48rem;font:inherit;";
  for (const spec of [...oneShot, ...ambient]) wrap.appendChild(makeButton(spec));
  return wrap;
}

/** The full interactive gallery: click any button to fire that effect. */
export const Gallery: Story = {
  render: () => gallery()
};

/** Fire confetti the moment the story mounts, via `<fluid-celebrate auto>`. */
export const DeclarativeAuto: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<p>This story fires confetti on mount via &lt;fluid-celebrate effect="confetti" auto&gt;.</p>' +
      '<fluid-celebrate effect="confetti" auto></fluid-celebrate>';
    return wrap;
  }
};

/** Confetti on a purchase: the canonical "order confirmed" celebration. */
export const ConfettiOnPurchase: Story = {
  render: () => {
    const btn = document.createElement("button");
    btn.textContent = "Complete purchase";
    btn.style.cssText =
      "padding:.7rem 1.2rem;border-radius:.5rem;border:0;cursor:pointer;font:inherit;" +
      "background:var(--fluid-accent-base,#6366f1);color:var(--fluid-accent-text,#fff);";
    btn.addEventListener("click", () => {
      confetti({ origin: btn, cannons: false });
    });
    return btn;
  }
};
