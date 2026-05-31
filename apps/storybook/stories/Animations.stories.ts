/**
 * Animations gallery, one story per registered animation, plus the catalog
 * and an interactive playground.
 *
 * The preview already imports `@fluid-ds/animations/define/controller` and
 * `@fluid-ds/animations/register-defaults`, so all 12 default animations are
 * available by name via `data-fluid-animation="<name>"`.
 *
 * Each individual animation story renders the same demo card. The replay
 * button strips and re-applies the animation attribute so the user can see
 * it run again without scrolling away from the story.
 */
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/tag";

interface Args {
  name: string;
  trigger: "mount" | "in-view" | "hover" | "click" | "manual";
  duration: number;
  delay: number;
  easing: string;
  iterations: string;
}

const ANIMATIONS = [
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "zoom-in",
  "pulse",
  "shake",
  "bounce",
  "flash",
  "spin"
];

const meta: Meta<Args> = {
  title: "Animations/Overview",
  parameters: {
    status: { type: "experimental" },
    docs: {
      description: {
        component: `
Attribute-driven animation system from \`@fluid-ds/animations\`. Apply any
registered animation to any element by setting \`data-fluid-animation\`.
Triggers, duration, delay, easing, and iterations are tuned via sibling
\`data-fluid-animation-*\` attributes. The global controller respects
\`prefers-reduced-motion\`.

\`\`\`html
<fluid-card data-fluid-animation="fade-in"
            data-fluid-animation-trigger="in-view">
  Fades in when scrolled into view.
</fluid-card>
\`\`\`

See the **Playground** story below for an interactive demo, or pick any
named animation in the sidebar to see it in isolation.
        `
      }
    }
  }
};

export default meta;
type Story = StoryObj<Args>;

/**
 * Catalog, every registered animation in a grid, each on a card with
 * a replay button. Click any card to re-run that animation in place.
 */
export const Catalog: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Click any card to replay its animation. Looping animations (pulse / spin) start themselves."
      }
    }
  },
  render: () => html`
    <div
      style="display:grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
             gap: var(--fluid-space-4); padding: var(--fluid-space-2);"
    >
      ${ANIMATIONS.map(
        (name) => html`
          <fluid-card
            variant="outline"
            style="cursor:pointer; user-select:none;"
            data-fluid-animation=${name}
            data-fluid-animation-trigger="mount"
            @click=${(e: MouseEvent) => replay(e.currentTarget as HTMLElement)}
          >
            <div
              style="display:flex; align-items:center; justify-content:space-between;
                     gap: var(--fluid-space-2);"
            >
              <strong>${name}</strong>
              <fluid-tag size="sm">replay</fluid-tag>
            </div>
            <p
              style="margin: var(--fluid-space-2) 0 0;
                     color: var(--fluid-text-secondary); font-size: 0.85rem;"
            >
              <code>data-fluid-animation="${name}"</code>
            </p>
          </fluid-card>
        `
      )}
    </div>
  `
};

/**
 * Interactive, controls for every knob the package exposes. Useful for
 * tuning a specific animation before pasting attributes into your app.
 */
export const Playground: Story = {
  argTypes: {
    name: { control: "select", options: ANIMATIONS },
    trigger: {
      control: "inline-radio",
      options: ["mount", "in-view", "hover", "click", "manual"]
    },
    duration: { control: { type: "number", min: 0, max: 5000, step: 50 } },
    delay: { control: { type: "number", min: 0, max: 5000, step: 50 } },
    easing: { control: "text" },
    iterations: { control: "text" }
  },
  args: {
    name: "fade-in",
    trigger: "mount",
    duration: 600,
    delay: 0,
    easing: "",
    iterations: ""
  },
  render: (args) => {
    const snippet = buildSnippet(args);
    return html`
      <div
        style="display:flex; flex-direction:column; gap: var(--fluid-space-4);
               max-width: 36rem;"
      >
        <fluid-card>
          <strong>Animated element</strong>
          <p style="color: var(--fluid-text-secondary); margin: var(--fluid-space-2) 0 0;">
            ${args.trigger === "manual"
              ? "Trigger is manual, use the replay button."
              : args.trigger === "click"
                ? "Trigger is click, click the card to play."
                : args.trigger === "hover"
                  ? "Trigger is hover, point at the card to play."
                  : args.trigger === "in-view"
                    ? "Trigger is in-view, scroll the card into view."
                    : "Trigger is mount, re-render to replay."}
          </p>
          <div slot="footer">
            <fluid-button
              size="sm"
              variant="secondary"
              @fluid-click=${(e: Event) => {
                const card = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                const target = (card.host as HTMLElement)
                  .closest("[data-storybook-playground-root]")
                  ?.querySelector<HTMLElement>("[data-anim-target]");
                if (target) replay(target);
              }}
            >
              Replay
            </fluid-button>
          </div>
        </fluid-card>

        <div data-storybook-playground-root>
          <fluid-card
            variant="outline"
            data-anim-target
            data-fluid-animation=${args.name}
            data-fluid-animation-trigger=${args.trigger}
            data-fluid-animation-duration=${args.duration}
            data-fluid-animation-delay=${args.delay}
            data-fluid-animation-easing=${args.easing || ""}
            data-fluid-animation-iterations=${args.iterations || ""}
          >
            <div style="display:flex; align-items:center; gap: var(--fluid-space-3);">
              <fluid-icon name="star" style="--fluid-icon-size: 1.5rem;"></fluid-icon>
              <div>
                <strong>${args.name}</strong>
                <div
                  style="color: var(--fluid-text-secondary); font-size:0.85rem;"
                >
                  trigger: ${args.trigger}
                </div>
              </div>
            </div>
          </fluid-card>
        </div>

        <fluid-code-block language="html" .code=${snippet}></fluid-code-block>
      </div>
    `;
  }
};

/** Individual stories for every animation. */
export const FadeIn: Story = single("fade-in");
export const FadeOut: Story = single("fade-out");
export const SlideUp: Story = single("slide-up");
export const SlideDown: Story = single("slide-down");
export const SlideLeft: Story = single("slide-left");
export const SlideRight: Story = single("slide-right");
export const ScaleIn: Story = single("scale-in");
export const ZoomIn: Story = single("zoom-in");
export const Pulse: Story = single("pulse");
export const Shake: Story = single("shake");
export const Bounce: Story = single("bounce");
export const Flash: Story = single("flash");
export const Spin: Story = single("spin");

/**
 * Build a single-animation story, a card with the animation attribute,
 * a click handler to replay, and a code snippet showing what to paste.
 */
function single(name: string): Story {
  return {
    name,
    parameters: {
      docs: {
        description: {
          story: `\`data-fluid-animation="${name}"\`, click the card to replay.`
        }
      }
    },
    render: () => html`
      <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 28rem;">
        <fluid-card
          variant="outline"
          style="cursor:pointer; user-select:none;"
          data-fluid-animation=${name}
          @click=${(e: MouseEvent) => replay(e.currentTarget as HTMLElement)}
        >
          <strong>${name}</strong>
          <p style="margin: var(--fluid-space-2) 0 0; color: var(--fluid-text-secondary);">
            Click anywhere on this card to replay.
          </p>
        </fluid-card>
        <fluid-code-block
          language="html"
          .code=${`<fluid-card data-fluid-animation="${name}">…</fluid-card>`}
        ></fluid-code-block>
      </div>
    `
  };
}

/**
 * Replay by toggling the attribute. The controller's MutationObserver
 * sees the attribute disappear and reappear and re-fires the animation.
 */
function replay(el: HTMLElement): void {
  const name = el.getAttribute("data-fluid-animation");
  if (!name) return;
  el.removeAttribute("data-fluid-animation");
  // Force a microtask so the mutation observer registers both edges.
  requestAnimationFrame(() => el.setAttribute("data-fluid-animation", name));
}

function buildSnippet(args: Args): string {
  const attrs: string[] = [`data-fluid-animation="${args.name}"`];
  if (args.trigger !== "mount")
    attrs.push(`data-fluid-animation-trigger="${args.trigger}"`);
  if (args.duration && args.duration !== 600)
    attrs.push(`data-fluid-animation-duration="${args.duration}"`);
  if (args.delay) attrs.push(`data-fluid-animation-delay="${args.delay}"`);
  if (args.easing) attrs.push(`data-fluid-animation-easing="${args.easing}"`);
  if (args.iterations) attrs.push(`data-fluid-animation-iterations="${args.iterations}"`);
  return `<fluid-card\n  ${attrs.join("\n  ")}\n>\n  …\n</fluid-card>`;
}
