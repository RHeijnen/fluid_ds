import { html, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidFormAssociated } from "../../internal/form-associated.js";

registerIcon(
  "upload",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`
);
registerIcon(
  "close",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);

/**
 * Drag-and-drop file selector with native file input fallback. Shows the
 * selected file list inline. Form-associated.
 *
 * @summary File selector with drag-drop zone.
 *
 * @slot label - Main label text shown in the drop zone.
 * @slot hint - Subtle hint shown below the main label.
 *
 * @csspart base - The drop zone container.
 * @csspart input - The hidden native file input.
 * @csspart label - The label wrapper.
 * @csspart file-list - The selected files list.
 * @csspart file - Each file row.
 *
 * Every styled property reads a component-scoped `--fluid-file-input-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-file-input-bg - Drop zone background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-file-input-border - Drop zone border color (dashed). Falls back to --fluid-border-default.
 * @cssproperty --fluid-file-input-border-width - Drop zone border width. Falls back to 2px.
 * @cssproperty --fluid-file-input-radius - Drop zone corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-file-input-fg - Drop zone label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-file-input-accent - Hover/drag accent color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-file-input-font-family - Label + file-row font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-file-input-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-file-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-file-input-icon-fg - Idle icon color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-file-input-hint-fg - Hint text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-file-input-file-bg - Selected file row background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-file-input-file-border - Selected file row border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-file-input-file-border-width - Selected file row border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-file-input-file-radius - Selected file row corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-file-input-file-name-fg - File name text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-file-input-file-size-fg - File size text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-file-input-remove-fg - Remove button color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-file-input-remove-hover-bg - Remove button hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-file-input-remove-hover-fg - Remove button hover color. Falls back to --fluid-text-primary.
 *
 * @uses-token --fluid-surface-subtle - Default drop zone background.
 * @uses-token --fluid-surface-base - Default file row background.
 * @uses-token --fluid-surface-muted - Remove-button hover background.
 * @uses-token --fluid-border-default - Default borders.
 * @uses-token --fluid-accent-base - Hover + drag-over color.
 * @uses-token --fluid-text-primary - Label + file-name text.
 * @uses-token --fluid-text-secondary - Hint, icon, file-size, remove-button text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum remove-button hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-field-border-width - Default file-row border width.
 * @uses-token --fluid-radius-md - Drop zone corner radius.
 * @uses-token --fluid-radius-sm - File row + remove-button corner radius.
 * @uses-token --fluid-font-family-sans - Label + file-row font family.
 *
 * @fires fluid-change - Fired when the selected file list changes.
 *   detail.files holds a FileList; detail.value is a comma-separated filename string.
 */
export class FluidFileInput extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }

    .dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-6);
      background: var(--fluid-file-input-bg, var(--fluid-surface-subtle));
      border: var(--fluid-file-input-border-width, 2px) dashed
        var(--fluid-file-input-border, var(--fluid-border-default));
      border-radius: var(--fluid-file-input-radius, var(--fluid-radius-md));
      cursor: pointer;
      color: var(--fluid-file-input-fg, var(--fluid-text-primary));
      text-align: center;
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      font-family: var(--fluid-file-input-font-family, var(--fluid-font-family-sans));
    }

    .dropzone:hover:not(.disabled),
    .dropzone.dragging {
      border-color: var(--fluid-file-input-accent, var(--fluid-accent-base));
      background: color-mix(
        in srgb,
        var(--fluid-file-input-accent, var(--fluid-accent-base)) 6%,
        var(--fluid-file-input-bg, var(--fluid-surface-subtle))
      );
    }

    .dropzone:focus-visible {
      outline: var(--fluid-file-input-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-file-input-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }

    .dropzone.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      width: 2rem;
      height: 2rem;
      color: var(--fluid-file-input-icon-fg, var(--fluid-text-secondary));
    }
    .dropzone:hover:not(.disabled) .icon,
    .dropzone.dragging .icon {
      color: var(--fluid-file-input-accent, var(--fluid-accent-base));
    }

    .label {
      font-size: var(--fluid-font-size-md);
      font-weight: var(--fluid-font-weight-medium);
    }
    .hint {
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-file-input-hint-fg, var(--fluid-text-secondary));
    }

    input[type="file"] {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-1);
    }
    .file {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-2) var(--fluid-space-3);
      background: var(--fluid-file-input-file-bg, var(--fluid-surface-base));
      border: var(--fluid-file-input-file-border-width, var(--fluid-field-border-width, 1px)) solid
        var(--fluid-file-input-file-border, var(--fluid-border-default));
      border-radius: var(--fluid-file-input-file-radius, var(--fluid-radius-sm));
      font-family: var(--fluid-file-input-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-font-size-sm);
    }
    .file-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .file-name {
      color: var(--fluid-file-input-file-name-fg, var(--fluid-text-primary));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-size {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-file-input-file-size-fg, var(--fluid-text-secondary));
    }
    /*
     * SC 2.5.8 Target Size. The remove button floors its box to
     * --fluid-target-min, so AA keeps it at 24px and AAA grows the hit area to
     * 44px without resizing the close glyph.
     */
    .file-remove {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      width: max(1.5rem, var(--fluid-target-min, 0px));
      height: max(1.5rem, var(--fluid-target-min, 0px));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--fluid-file-input-file-radius, var(--fluid-radius-sm));
      color: var(--fluid-file-input-remove-fg, var(--fluid-text-secondary));
      flex-shrink: 0;
    }
    .file-remove:hover {
      background: var(--fluid-file-input-remove-hover-bg, var(--fluid-surface-muted));
      color: var(--fluid-file-input-remove-hover-fg, var(--fluid-text-primary));
    }
    .file-remove:focus-visible {
      outline: var(--fluid-file-input-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-file-input-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 1px;
    }
  `;

  @query("input[type='file']") private inputEl!: HTMLInputElement;

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Accept attribute (e.g. "image/*"). */
  @property() accept = "";

  /** Allow multiple files. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form validation. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = "File input";

  @state() private files: File[] = [];
  @state() private dragging = false;

  /** Resets the file list. */
  reset(): void {
    this.files = [];
    if (this.inputEl) this.inputEl.value = "";
    this.updateFormValue();
  }

  override formResetCallback(): void {
    this.reset();
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLElement>(".dropzone")?.focus(options);
  }

  protected override willUpdate(): void {
    // Always re-sync the form value, `files` is a private state that
    // doesn't appear on PropertyValues<this>, and the cost of a no-op call
    // is negligible.
    this.updateFormValue();
  }

  private updateFormValue(): void {
    if (!this.files.length) {
      this.internals.setFormValue(null);
      if (this.required) {
        this.setValidity({ valueMissing: true }, "Please select a file.");
      } else {
        this.setValidity({});
      }
      return;
    }
    // For multipart submission, FormData supports multiple files under the same name.
    const fd = new FormData();
    for (const file of this.files) fd.append(this.name || "file", file, file.name);
    this.internals.setFormValue(fd);
    this.setValidity({});
  }

  private commitFiles(fileList: FileList | null): void {
    if (!fileList || !fileList.length) return;
    const incoming = Array.from(fileList);
    this.files = this.multiple ? [...this.files, ...incoming] : incoming.slice(0, 1);
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: this.files, value: this.files.map((f) => f.name).join(", ") },
        bubbles: true,
        composed: true
      })
    );
  }

  private removeFile(index: number): void {
    this.files = this.files.filter((_, i) => i !== index);
    if (!this.files.length && this.inputEl) this.inputEl.value = "";
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: this.files, value: this.files.map((f) => f.name).join(", ") },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleClick = () => {
    if (this.disabled) return;
    this.inputEl?.click();
  };

  private handleKey = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.inputEl?.click();
    }
  };

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.commitFiles(input.files);
  };

  private handleDragOver = (e: DragEvent) => {
    if (this.disabled) return;
    e.preventDefault();
    this.dragging = true;
  };

  private handleDragLeave = () => {
    this.dragging = false;
  };

  private handleDrop = (e: DragEvent) => {
    if (this.disabled) return;
    e.preventDefault();
    this.dragging = false;
    this.commitFiles(e.dataTransfer?.files ?? null);
  };

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <label
          part="label"
          class=${classMap({ dropzone: true, dragging: this.dragging, disabled: this.disabled })}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <fluid-icon class="icon" name="upload"></fluid-icon>
          <div class="label">
            <slot name="label">Click or drag files here</slot>
          </div>
          <div class="hint">
            <slot name="hint">
              ${this.multiple ? "Multiple files supported" : "One file at a time"}
            </slot>
          </div>
          <input
            part="input"
            type="file"
            accept=${this.accept}
            aria-label=${this.ariaLabel ?? "File input"}
            ?multiple=${this.multiple}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @change=${this.handleChange}
          />
        </label>
        ${this.files.length
          ? html`
              <div part="file-list" class="file-list">
                ${this.files.map(
                  (file, i) => html`
                    <div part="file" class="file">
                      <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatSize(file.size)}</span>
                      </div>
                      <button
                        class="file-remove"
                        type="button"
                        aria-label=${`Remove ${file.name}`}
                        @click=${() => this.removeFile(i)}
                      >
                        <fluid-icon name="close"></fluid-icon>
                      </button>
                    </div>
                  `
                )}
              </div>
            `
          : ""}
      </div>
    `;
  }
}
