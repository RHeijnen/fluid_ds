import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Declarative HTML include. Fetches the resource at `src` and renders it
 * into the element. Useful for sharing fragments (headers, footers, marketing
 * blocks) without a build step.
 *
 * For safety, inline `<script>` tags in the fetched markup are NOT executed
 * by default. Set `allow-scripts` to opt in (only do this for trusted sources).
 *
 * @summary Declarative HTML include.
 *
 * @slot - Fallback content displayed while loading or on error.
 *
 * @csspart base - The container that holds the included markup.
 *
 * @fires fluid-load - Fired when the include succeeds; detail = { src }.
 * @fires fluid-error - Fired when the include fails; detail = { src, status }.
 */
export class FluidInclude extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  /** URL of the HTML to include. */
  @property() src: string | null = null;

  /** Fetch mode. */
  @property() mode: RequestMode = "cors";

  /** Execute `<script>` tags found in the included markup. Off by default. */
  @property({ type: Boolean, attribute: "allow-scripts" }) allowScripts = false;

  @state() private status: "idle" | "loading" | "loaded" | "error" = "idle";

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("src") && this.src) this.load();
  }

  private async load(): Promise<void> {
    if (!this.src) return;
    this.status = "loading";
    try {
      const response = await fetch(this.src, { mode: this.mode });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const container = this.shadowRoot?.querySelector(".content") as HTMLDivElement | null;
      if (!container) return;
      container.innerHTML = text;
      if (this.allowScripts) this.executeScripts(container);
      this.status = "loaded";
      this.dispatchEvent(
        new CustomEvent("fluid-load", { detail: { src: this.src }, bubbles: true, composed: true })
      );
    } catch (err) {
      this.status = "error";
      this.dispatchEvent(
        new CustomEvent("fluid-error", {
          detail: { src: this.src, error: err },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  /** Re-execute script tags by re-creating them (innerHTML doesn't run them). */
  private executeScripts(container: HTMLElement): void {
    for (const original of Array.from(container.querySelectorAll("script"))) {
      const replacement = document.createElement("script");
      for (const attr of Array.from(original.attributes)) {
        replacement.setAttribute(attr.name, attr.value);
      }
      replacement.textContent = original.textContent;
      original.replaceWith(replacement);
    }
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="content" data-status=${this.status}></div>
      ${this.status === "loaded" ? "" : html`<slot></slot>`}
    `;
  }
}
