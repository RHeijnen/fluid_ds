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

  /** Aborts the in-flight fetch on teardown or when a new load supersedes it. */
  private loadController: AbortController | null = null;

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("src") && this.src) this.load();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.loadController?.abort();
    this.loadController = null;
  }

  private async load(): Promise<void> {
    if (!this.src) return;
    // Supersede any in-flight request before starting a new one.
    this.loadController?.abort();
    const controller = new AbortController();
    this.loadController = controller;
    this.status = "loading";
    try {
      const response = await fetch(this.src, { mode: this.mode, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      // Bail out if we were disconnected (or superseded) during the await: never
      // write markup or run scripts into a detached / stale element.
      if (!this.isConnected || this.loadController !== controller) return;
      const container = this.shadowRoot?.querySelector(".content") as HTMLDivElement | null;
      if (!container) return;
      container.innerHTML = text;
      if (this.allowScripts) this.executeScripts(container);
      this.status = "loaded";
      this.dispatchEvent(
        new CustomEvent("fluid-load", { detail: { src: this.src }, bubbles: true, composed: true })
      );
    } catch (err) {
      // An aborted fetch is an intentional teardown, not a load failure.
      if ((err as Error)?.name === "AbortError") return;
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
