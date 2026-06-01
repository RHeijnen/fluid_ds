import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

registerIcon(
  "result-success",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`
);
registerIcon(
  "result-error",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
);
registerIcon(
  "result-info",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
);
registerIcon(
  "result-warning",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
);
registerIcon(
  "result-404",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>`
);

export type FluidResultStatus = "success" | "error" | "info" | "warning" | "404";

/**
 * A full-width status / result block for success, error, info, warning, or
 * "404 not found" states. It is the larger sibling of
 * [`<fluid-empty-state>`](/components/empty-state/): a centered column with a
 * large status icon, a title, an optional subtitle, optional extra detail, and
 * a row of call-to-action buttons. Reach for it on confirmation pages, error
 * screens, and full-page "not found" / "access denied" views.
 *
 * The status is conveyed by a label-bearing text title (never color alone:
 * SC 1.4.1) and a status-tinted icon. Icon color comes from the
 * theme-independent semantic status tokens so it stays meaningful across all
 * three brands.
 *
 * Semantics follow the WAI-ARIA "status" / "alert" live-region patterns: the
 * block is `role="status"` (polite) for success / info / 404, and
 * `role="alert"` (assertive) for error / warning, so a result rendered after a
 * user action is announced.
 *
 * @summary Full-width success / error / info / warning / 404 result block.
 *
 * @slot icon - Custom status glyph. Defaults to a status-appropriate icon.
 * @slot - Extra detail rendered below the subtitle.
 * @slot actions - Call-to-action buttons below the content.
 *
 * @csspart base - The centered column container.
 * @csspart icon - The status icon wrapper.
 * @csspart title - The title element.
 * @csspart subtitle - The subtitle element.
 * @csspart content - The extra-detail wrapper (default slot).
 * @csspart actions - The actions wrapper.
 *
 * @cssproperty --fluid-result-fg - Title text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-result-muted-fg - Subtitle / detail text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-result-gap - Vertical gap between elements. Falls back to var(--fluid-space-3).
 * @cssproperty --fluid-result-padding - Block padding. Falls back to var(--fluid-space-8).
 * @cssproperty --fluid-result-max-width - Max content column width. Falls back to 32rem.
 * @cssproperty --fluid-result-icon-size - Status icon diameter. Falls back to 4rem.
 * @cssproperty --fluid-result-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-result-title-size - Title font size. Falls back to --fluid-font-size-xl.
 * @cssproperty --fluid-result-subtitle-size - Subtitle font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-result-success-icon - Success icon color. Falls back to --fluid-success-base.
 * @cssproperty --fluid-result-error-icon - Error icon color. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-result-info-icon - Info icon color. Falls back to --fluid-info-base.
 * @cssproperty --fluid-result-warning-icon - Warning icon color. Falls back to --fluid-warning-base.
 * @cssproperty --fluid-result-404-icon - 404 icon color. Falls back to --fluid-text-secondary.
 *
 * @uses-token --fluid-text-primary - Title text.
 * @uses-token --fluid-text-secondary - Subtitle / detail text and the 404 icon.
 * @uses-token --fluid-success-base - Success icon color.
 * @uses-token --fluid-danger-base - Error icon color.
 * @uses-token --fluid-info-base - Info icon color.
 * @uses-token --fluid-warning-base - Warning icon color.
 */
export class FluidResult extends FluidElement {
  static override styles = [
    css`
      :host {
        display: block;
        font-family: var(--fluid-result-font-family, var(--fluid-font-family-sans));
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--fluid-result-gap, var(--fluid-space-3));
        max-width: var(--fluid-result-max-width, 32rem);
        margin-inline: auto;
        padding: var(--fluid-result-padding, var(--fluid-space-8));
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--fluid-result-icon-size, 4rem);
        height: var(--fluid-result-icon-size, 4rem);
        font-size: var(--fluid-result-icon-size, 4rem);
        line-height: 1;
      }
      .icon ::slotted(*) {
        width: 100%;
        height: 100%;
      }
      .icon fluid-icon {
        width: 100%;
        height: 100%;
      }

      .status-success .icon {
        color: var(--fluid-result-success-icon, var(--fluid-success-base));
      }
      .status-error .icon {
        color: var(--fluid-result-error-icon, var(--fluid-danger-base));
      }
      .status-info .icon {
        color: var(--fluid-result-info-icon, var(--fluid-info-base));
      }
      .status-warning .icon {
        color: var(--fluid-result-warning-icon, var(--fluid-warning-base));
      }
      .status-404 .icon {
        color: var(--fluid-result-404-icon, var(--fluid-text-secondary));
      }

      .title {
        margin: 0;
        font-size: var(--fluid-result-title-size, var(--fluid-font-size-xl));
        font-weight: var(--fluid-font-weight-semibold);
        line-height: var(--fluid-font-line-height-tight, 1.25);
        color: var(--fluid-result-fg, var(--fluid-text-primary));
      }

      .subtitle {
        margin: 0;
        font-size: var(--fluid-result-subtitle-size, var(--fluid-font-size-md));
        line-height: var(--fluid-font-line-height-normal, 1.5);
        color: var(--fluid-result-muted-fg, var(--fluid-text-secondary));
      }

      .content {
        font-size: var(--fluid-font-size-md);
        line-height: var(--fluid-font-line-height-normal, 1.5);
        color: var(--fluid-result-muted-fg, var(--fluid-text-secondary));
      }
      .content ::slotted(*) {
        margin: 0 !important;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--fluid-space-2);
        justify-content: center;
        margin-top: var(--fluid-space-2);
      }

      /* Collapse empty optional regions so they don't add gap. */
      .empty {
        display: none;
      }
    `,
    reducedMotion
  ];

  /** Result status. Drives the default icon, its color, and the live-region role. */
  @property({ reflect: true }) status: FluidResultStatus = "info";

  /**
   * Primary title text. Provides the non-color status label (SC 1.4.1).
   * `override` because `HTMLElement` already declares a `title` member.
   */
  @property() override title = "";

  /** Secondary supporting text shown below the title. */
  @property() subtitle = "";

  private hasContentSlot = false;
  private hasActionsSlot = false;

  /** "alert" (assertive) for error / warning, "status" (polite) otherwise. */
  private liveRole(): "alert" | "status" {
    return this.status === "error" || this.status === "warning" ? "alert" : "status";
  }

  private defaultIconName(): string {
    return `result-${this.status}`;
  }

  private handleSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedNodes({ flatten: true }).some((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? "").trim().length > 0;
      }
      return true;
    });
    if (slot.name === "actions") {
      this.hasActionsSlot = assigned;
    } else {
      this.hasContentSlot = assigned;
    }
    this.requestUpdate();
  };

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base status-${this.status}"
        role=${this.liveRole()}
        aria-atomic="true"
      >
        <span part="icon" class="icon">
          <slot name="icon">
            <fluid-icon name=${this.defaultIconName()}></fluid-icon>
          </slot>
        </span>
        ${this.title
          ? html`<p part="title" class="title">${this.title}</p>`
          : ""}
        ${this.subtitle
          ? html`<p part="subtitle" class="subtitle">${this.subtitle}</p>`
          : ""}
        <div part="content" class="content ${this.hasContentSlot ? "" : "empty"}">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div part="actions" class="actions ${this.hasActionsSlot ? "" : "empty"}">
          <slot name="actions" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
