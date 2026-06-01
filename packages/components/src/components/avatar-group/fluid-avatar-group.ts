import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidAvatarGroupSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Stacks slotted `<fluid-avatar>` elements with a slight overlap so a set of
 * people reads as one cluster. A `max` prop caps how many show: the first N
 * stay visible and a trailing "+N" overflow circle stands in for the rest.
 *
 * The group is a single `role="group"` with an accessible name (`label` or an
 * auto-generated "N members") so assistive tech announces the cluster as a
 * whole rather than reading every avatar.
 *
 * Sizing mirrors `<fluid-avatar>`: set `size` on the group and it both scales
 * the overflow circle AND forwards the size to every slotted avatar that hasn't
 * set its own.
 *
 * @summary Overlapping stack of avatars with a "+N" overflow counter.
 *
 * @slot - One or more `<fluid-avatar>` elements.
 *
 * @csspart base - The group container.
 * @csspart overflow - The trailing "+N" counter circle (when avatars exceed `max`).
 *
 * @cssproperty --fluid-avatar-group-overlap - How far each avatar slides under the previous one.
 * @cssproperty --fluid-avatar-group-ring - Ring color drawn between overlapping avatars and around the overflow circle.
 * @cssproperty --fluid-avatar-group-overflow-bg - Overflow circle background color.
 * @cssproperty --fluid-avatar-group-overflow-fg - Overflow circle foreground (text) color.
 *
 * @uses-token --fluid-surface-base - Default ring color that separates the stacked avatars.
 * @uses-token --fluid-surface-muted - Default overflow circle background.
 * @uses-token --fluid-text-primary - Default overflow circle text color.
 */
export class FluidAvatarGroup extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: inline-flex;
      align-items: center;
    }

    /*
     * Each item (slotted avatar AND the overflow circle) slides under its
     * predecessor and draws a ring so the overlap reads as a clean separation.
     */
    .base ::slotted(fluid-avatar),
    .overflow {
      box-shadow: 0 0 0 var(--fluid-avatar-group-ring-width, 2px)
        var(--fluid-avatar-group-ring, var(--fluid-surface-base));
      border-radius: var(--fluid-radius-full);
    }

    .base ::slotted(fluid-avatar:not(:first-child)),
    .overflow {
      margin-left: calc(-1 * var(--fluid-avatar-group-overlap, 0.6rem));
    }

    /* Avatars beyond the max are removed from the layout AND the a11y tree. */
    .base ::slotted(fluid-avatar[data-fluid-overflow]) {
      display: none;
    }

    .overflow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: var(--avatar-size, 2.5rem);
      height: var(--avatar-size, 2.5rem);
      background-color: var(
        --fluid-avatar-group-overflow-bg,
        var(--fluid-surface-muted)
      );
      color: var(--fluid-avatar-group-overflow-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
      font-weight: var(--fluid-font-weight-semibold);
      font-size: calc(var(--avatar-size, 2.5rem) * 0.36);
      line-height: 1;
      letter-spacing: -0.02em;
      user-select: none;
    }

    /* Sizes mirror <fluid-avatar>: drive the overflow circle's --avatar-size. */
    :host([size="xs"]) {
      --avatar-size: 1.25rem;
    }
    :host([size="sm"]) {
      --avatar-size: 1.75rem;
    }
    :host([size="md"]) {
      --avatar-size: 2.5rem;
    }
    :host([size="lg"]) {
      --avatar-size: 3.5rem;
    }
    :host([size="xl"]) {
      --avatar-size: 5rem;
    }
  `;

  /** Avatar size, forwarded to slotted avatars and applied to the overflow circle. */
  @property({ reflect: true }) size: FluidAvatarGroupSize = "md";

  /**
   * Maximum number of avatars to show before collapsing the rest into a "+N"
   * overflow circle. `0` (the default) shows them all.
   */
  @property({ type: Number, reflect: true }) max = 0;

  /**
   * Accessible name for the group. When unset, an "N members" label is derived
   * from the avatar count.
   */
  @property() label = "";

  @state() private overflowCount = 0;

  /** Number of slotted avatars currently in the group. */
  @state() private total = 0;

  private handleSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const avatars = slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HTMLElement => el.tagName.toLowerCase() === "fluid-avatar"
      );

    this.applyToAvatars(avatars);
  };

  /**
   * Default `<fluid-avatar>` size. The element reflects this even when the
   * author set nothing, so a bare avatar always carries `size="md"`. We treat
   * that exact value (when we have not already forwarded a size ourselves) as
   * "unset" so a group `size` can take over, while any other author-set size
   * wins.
   */
  private static readonly AVATAR_DEFAULT_SIZE = "md";

  /**
   * Reconcile the slotted avatars: mark overflow, manage the a11y tree, update
   * the count used for the accessible name, and forward the group size to any
   * avatar the author did not explicitly size.
   */
  private applyToAvatars(avatars: HTMLElement[]): void {
    this.total = avatars.length;
    const limit = this.max > 0 ? this.max : avatars.length;

    avatars.forEach((avatar, index) => {
      const hidden = index >= limit;
      if (hidden) {
        avatar.setAttribute("data-fluid-overflow", "");
        // Keep overflowed avatars out of the accessibility tree too.
        avatar.setAttribute("aria-hidden", "true");
      } else {
        avatar.removeAttribute("data-fluid-overflow");
        avatar.removeAttribute("aria-hidden");
      }

      // Forward the group's size unless the author gave this avatar its own.
      // We mark every size we write with `data-fluid-group-size`; an avatar is
      // author-sized when its current `size` is neither one we wrote nor the
      // avatar's reflected default. That distinction lets a group `size`
      // propagate to bare avatars while leaving author-set sizes untouched.
      const forwarded = avatar.getAttribute("data-fluid-group-size");
      const current = avatar.getAttribute("size");
      const authorSized =
        current !== null &&
        current !== forwarded &&
        current !== FluidAvatarGroup.AVATAR_DEFAULT_SIZE;
      if (!authorSized) {
        avatar.setAttribute("data-fluid-group-size", this.size);
        avatar.setAttribute("size", this.size);
      }
    });

    this.overflowCount = Math.max(0, avatars.length - limit);
  }

  /** Collect the slotted `<fluid-avatar>` elements from the default slot. */
  private slottedAvatars(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector("slot");
    if (!slot) return [];
    return slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HTMLElement => el.tagName.toLowerCase() === "fluid-avatar"
      );
  }

  override firstUpdated(): void {
    // Compute the count and forward sizes on first render too, so the
    // accessible name is correct even before the first slotchange is observed.
    this.applyToAvatars(this.slottedAvatars());
  }

  private accessibleName(): string {
    if (this.label) return this.label;
    const n = this.total;
    return `${n} ${n === 1 ? "member" : "members"}`;
  }

  override render(): TemplateResult {
    return html`
      <span
        part="base"
        class="base"
        role="group"
        aria-label=${this.accessibleName()}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
        ${this.overflowCount > 0
          ? html`<span
              part="overflow"
              class="overflow"
              aria-hidden="true"
              >+${this.overflowCount}</span
            >`
          : ""}
      </span>
    `;
  }
}
