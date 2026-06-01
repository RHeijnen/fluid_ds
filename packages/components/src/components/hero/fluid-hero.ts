import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

type HeroAlign = "start" | "center";
type HeroMediaPosition = "end" | "start" | "background";
type HeroSize = "sm" | "md" | "lg";

/**
 * A page hero / masthead: a compositional layout shell for the top of a
 * landing or section page. It arranges an optional eyebrow, your heading, a
 * description, call-to-action buttons, and an optional media block (image or
 * illustration) beside or behind the content.
 *
 * This is a layout container only: you provide the heading in the default slot
 * (e.g. an `<h1>`), so the hero never injects its own heading and never
 * disturbs the document outline. The media's alt text is the author's
 * responsibility.
 *
 * @summary A slot-driven page hero / masthead.
 *
 * @slot eyebrow - A small kicker line above the heading.
 * @slot - The heading (provide your own `<h1>` / `<h2>`).
 * @slot description - Supporting copy below the heading.
 * @slot actions - Call-to-action buttons.
 * @slot media - An image or illustration shown beside (or behind) the content.
 *
 * @csspart base - The hero section.
 * @csspart content - The text column.
 * @csspart eyebrow - The eyebrow wrapper.
 * @csspart description - The description wrapper.
 * @csspart actions - The actions wrapper.
 * @csspart media - The media wrapper.
 *
 * @cssproperty --fluid-hero-bg - Background. Falls back to transparent.
 * @cssproperty --fluid-hero-fg - Heading text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-hero-description-fg - Description color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-hero-eyebrow-fg - Eyebrow color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-hero-gap - Gap between content and media. Falls back to 3rem.
 * @cssproperty --fluid-hero-padding - Section padding. Falls back to a responsive block padding.
 * @cssproperty --fluid-hero-max-width - Max content width. Falls back to 70rem.
 * @cssproperty --fluid-hero-radius - Media corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-hero-overlay - Scrim over background media. Falls back to a 55% surface tint.
 *
 * @uses-token --fluid-text-primary - Heading text.
 * @uses-token --fluid-text-secondary - Description text.
 * @uses-token --fluid-accent-base - Eyebrow text.
 * @uses-token --fluid-radius-lg - Media radius.
 */
export class FluidHero extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--fluid-hero-bg, transparent);
      color: var(--fluid-hero-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
    }
    .base {
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--fluid-hero-gap, 3rem);
      align-items: center;
      max-width: var(--fluid-hero-max-width, 70rem);
      margin-inline: auto;
      padding: var(--fluid-hero-padding, clamp(2.5rem, 6vw, 6rem) 1.25rem);
    }
    /* Side-by-side once there is room; the media column shares the row. */
    @container (min-width: 48rem) {
      :host([media-position="end"]) .base,
      :host([media-position="start"]) .base {
        grid-template-columns: 1.1fr 1fr;
      }
      :host([media-position="start"]) .content {
        order: 2;
      }
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      min-width: 0;
    }
    :host([align="center"]) .content {
      align-items: center;
      text-align: center;
    }
    .eyebrow {
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--fluid-hero-eyebrow-fg, var(--fluid-accent-base));
    }
    .description {
      font-size: var(--fluid-font-size-lg, 1.125rem);
      line-height: 1.6;
      color: var(--fluid-hero-description-fg, var(--fluid-text-secondary));
      max-width: 46ch;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    :host([align="center"]) .actions {
      justify-content: center;
    }
    .media {
      min-width: 0;
    }
    .media ::slotted(*) {
      width: 100%;
      height: auto;
      border-radius: var(--fluid-hero-radius, var(--fluid-radius-lg, 0.75rem));
    }
    /* Heading slot: pin sizing so a slotted h1 reads as a hero heading and
       does not inherit a tiny page default; reset slotted margins. */
    .content ::slotted(:is(h1, h2)) {
      margin: 0;
      font-size: var(--fluid-hero-heading-size, clamp(2rem, 5vw, 3.5rem));
      line-height: 1.1;
      font-weight: 800;
      color: inherit;
    }
    .content ::slotted(*) {
      margin: 0;
    }
    :host([size="sm"]) { --fluid-hero-heading-size: clamp(1.6rem, 4vw, 2.5rem); }
    :host([size="lg"]) { --fluid-hero-heading-size: clamp(2.4rem, 6vw, 4.25rem); }

    /* Background media sits behind the content with a readable scrim. */
    :host([media-position="background"]) .base {
      grid-template-columns: 1fr;
    }
    :host([media-position="background"]) .media {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    :host([media-position="background"]) .media ::slotted(*) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0;
    }
    :host([media-position="background"]) .media::after {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--fluid-hero-overlay, color-mix(in srgb, var(--fluid-surface-base, #fff) 55%, transparent));
    }
    :host([media-position="background"]) .content {
      position: relative;
      z-index: 1;
    }
    :host([hidden]) { display: none; }
    /* Collapse optional regions whose slot has no assigned content (toggled
       via slotchange) so they add no stray gap. */
    [hidden] { display: none !important; }
  `;

  /** Horizontal alignment of the content column. */
  @property({ reflect: true }) align: HeroAlign = "start";

  /** Where the media sits relative to the content. */
  @property({ reflect: true, attribute: "media-position" }) mediaPosition: HeroMediaPosition = "end";

  /** Overall scale (drives the heading size + padding feel). */
  @property({ reflect: true }) size: HeroSize = "md";

  override connectedCallback(): void {
    super.connectedCallback();
    // Establish a container so the side-by-side layout responds to the hero's
    // own width, not the viewport (works inside any column).
    this.style.containerType ||= "inline-size";
  }

  /** Hide an optional region's wrapper when its slot has no real content. */
  private syncEmpty(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.parentElement;
    if (!wrapper) return;
    const hasContent = slot
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent ?? "").trim().length > 0);
    wrapper.toggleAttribute("hidden", !hasContent);
  }

  override render(): TemplateResult {
    return html`
      <section part="base" class="base">
        <div part="content" class="content">
          <div part="eyebrow" class="eyebrow" hidden><slot name="eyebrow" @slotchange=${this.syncEmpty}></slot></div>
          <slot></slot>
          <div part="description" class="description" hidden><slot name="description" @slotchange=${this.syncEmpty}></slot></div>
          <div part="actions" class="actions" hidden><slot name="actions" @slotchange=${this.syncEmpty}></slot></div>
        </div>
        <div part="media" class="media" hidden><slot name="media" @slotchange=${this.syncEmpty}></slot></div>
      </section>
    `;
  }
}
