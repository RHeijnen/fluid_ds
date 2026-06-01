import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidTimelineItem } from "./fluid-timeline-item.js";

/**
 * A vertical, ordered list of events: think activity feeds, audit logs,
 * order-status histories, or changelogs. Renders an ordered list of
 * `<fluid-timeline-item>` children, each with a marker dot, optional time
 * stamp, and free-form content, joined by a connecting line.
 *
 * This is a presentational, semantic container: the items form a list (the
 * ordering is conveyed visually and by reading order), so the component exposes
 * `role="list"` with each item as `role="listitem"`. It is not interactive and
 * does not own a value.
 *
 * The list semantics use `role="list"` on a `<div>` rather than a literal `<ol>`
 * because a shadow-DOM `<ol>` may only contain `<li>` / `<template>` / `<script>`
 * per the HTML spec, so a `<slot>` inside it would be a markup violation. The
 * role gives the same accessibility tree (screen readers do not announce `<ol>`
 * ordinals anyway, the visible markers carry the order).
 *
 * @summary Container for an ordered set of `<fluid-timeline-item>` events.
 *
 * @slot - One or more `<fluid-timeline-item>` elements.
 *
 * @csspart base - The list wrapper (role="list").
 *
 * @cssproperty --fluid-timeline-gap - Vertical gap between items. Falls back to --fluid-space-4.
 *
 * @uses-token --fluid-space-4 - Default gap between items.
 * @uses-token --fluid-font-family-sans - Inherited typography for slotted content.
 */
export class FluidTimeline extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
      line-height: var(--fluid-line-height-normal, 1.5);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-timeline-gap, var(--fluid-space-4));
    }
  `;

  /** Accessible name for the timeline list. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncItems();
  }

  protected override firstUpdated(): void {
    this.syncItems();
  }

  protected override updated(_changed: PropertyValues<this>): void {
    this.syncItems();
  }

  private getItems(): FluidTimelineItem[] {
    return Array.from(this.querySelectorAll("fluid-timeline-item")) as FluidTimelineItem[];
  }

  /**
   * Tell each item whether it is the last one so it can suppress its trailing
   * connecting line. The line runs from one marker down to the next, so the
   * final item draws no line below it.
   */
  private syncItems(): void {
    const items = this.getItems();
    items.forEach((item, i) => {
      item.last = i === items.length - 1;
    });
  }

  private handleSlotChange = () => this.syncItems();

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base"
        role="list"
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
