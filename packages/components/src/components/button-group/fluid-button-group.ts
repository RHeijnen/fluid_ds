import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Visually-fused group of buttons. Useful for toolbars, segmented actions,
 * and **split buttons** (a primary action fused to a caret-triggered menu).
 * The group flattens the interior corners so the members read as one shape,
 * with corner rounding only on the outermost two.
 *
 * Members are `<fluid-button>` elements. A member may also be a
 * `<fluid-dropdown>` whose `slot="trigger"` button is a `<fluid-button caret>`
 *, the group reaches that nested trigger and fuses it like any other member,
 * which is how a split button is built.
 *
 * ## How the fusion works
 *
 * Rather than reach across shadow boundaries with `::slotted()` / `::part()`
 * (which can't see a trigger nested inside a `<fluid-dropdown>`), the group
 * stamps `data-fluid-group="first|inner|last|only"` (and
 * `data-fluid-group-orientation`) on each member button. `<fluid-button>`
 * owns the matching corner-flattening + border-overlap CSS. This keeps the
 * fusion working no matter how deep the trigger is slotted.
 *
 * @summary Row or column of fused buttons (incl. split buttons).
 *
 * @slot - One or more `<fluid-button>` or `<fluid-dropdown>` (split button).
 *
 * @csspart base - The outer container.
 *
 * @uses-token --fluid-field-border-radius - Outer-corner radius (applied by the member buttons).
 */
export class FluidButtonGroup extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .base {
      display: inline-flex;
    }

    :host([orientation="vertical"]) .base {
      flex-direction: column;
    }
  `;

  @query("slot") private defaultSlot!: HTMLSlotElement;

  /** Layout orientation. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal";

  /** Accessible label for the group (role=group). */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "group");
  }

  protected override updated(changed: PropertyValues<this>): void {
    // Re-stamp when orientation flips so the flattened seams move with it.
    if (changed.has("orientation")) this.stampMembers();
  }

  /**
   * Resolve the fusible button for a slotted member. A direct
   * `<fluid-button>` is itself; a `<fluid-dropdown>` member exposes its
   * `slot="trigger"` button (the split-button caret). Anything else returns
   * null and is skipped (it still occupies a slot position but isn't fused).
   */
  private memberButton(el: Element): HTMLElement | null {
    if (el.tagName === "FLUID-BUTTON") return el as HTMLElement;
    if (el.tagName === "FLUID-DROPDOWN") {
      return el.querySelector<HTMLElement>(
        ':scope > fluid-button[slot="trigger"], :scope > [slot="trigger"]'
      );
    }
    return null;
  }

  /**
   * Stamp position + orientation data attributes on every member button so
   * each one flattens the correct corners. Re-run on every slotchange (and
   * orientation change) so adding/removing members keeps the rounding right.
   */
  private stampMembers(): void {
    const slot = this.defaultSlot;
    if (!slot) return;
    const members = slot
      .assignedElements({ flatten: true })
      .map((el) => this.memberButton(el))
      .filter((b): b is HTMLElement => b !== null);

    const last = members.length - 1;
    members.forEach((btn, i) => {
      const pos =
        members.length === 1 ? "only" : i === 0 ? "first" : i === last ? "last" : "inner";
      btn.setAttribute("data-fluid-group", pos);
      if (this.orientation === "vertical") {
        btn.setAttribute("data-fluid-group-orientation", "vertical");
      } else {
        btn.removeAttribute("data-fluid-group-orientation");
      }
    });
  }

  override render(): TemplateResult {
    return html`<div part="base" class="base">
      <slot @slotchange=${() => this.stampMembers()}></slot>
    </div>`;
  }
}
