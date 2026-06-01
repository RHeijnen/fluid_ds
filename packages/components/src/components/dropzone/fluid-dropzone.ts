import { html, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

registerIcon(
  "upload-cloud",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`
);
registerIcon(
  "dropzone-remove",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
);
registerIcon(
  "dropzone-file",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`
);

/** Reason a file was rejected by validation. */
export type FluidDropzoneRejectReason = "type" | "size";

interface RejectedFile {
  file: File;
  reason: FluidDropzoneRejectReason;
}

/**
 * A drag-and-drop file upload area with previews.
 *
 * A keyboard-focusable drop region (`role="button"`) that opens the native
 * file dialog on Enter or Space and also accepts dragover / drop. Selected
 * files are listed with name, size, and a remove button; image files get a
 * thumbnail. The component validates against `accept` and `maxSize`, accepts
 * the valid files, and emits the results.
 *
 * Not form-associated: it reports its selection through events rather than a
 * submitted form value, so a consumer owns the upload.
 *
 * The drop region maps to the WAI-ARIA button pattern: a `role="button"` with
 * `tabindex="0"` that activates on Enter and Space, backed by a visually
 * hidden native `<input type="file">` that does the actual picking.
 *
 * @summary Drag-and-drop file upload with previews.
 *
 * @slot - Optional custom prompt content shown inside the drop region,
 *   replacing the default label text.
 *
 * @csspart base - The outer container.
 * @csspart dropzone - The focusable drop region.
 * @csspart icon - The upload glyph in the drop region.
 * @csspart label - The prompt text.
 * @csspart list - The selected-files list.
 * @csspart file - A single file row.
 * @csspart thumb - An image thumbnail / file glyph.
 * @csspart remove - A file's remove button.
 *
 * Every styled property reads a component-scoped `--fluid-dropzone-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-dropzone-bg - Drop-region background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-dropzone-fg - Prompt text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-dropzone-border - Dashed border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dropzone-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-dropzone-accent - Active / dragover accent. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-dropzone-active-bg - Background while dragging over. Falls back to a tint of the accent.
 * @cssproperty --fluid-dropzone-icon-color - Upload glyph color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-dropzone-file-bg - File-row background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-dropzone-file-fg - File-row text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-dropzone-file-meta-fg - File size / meta text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-dropzone-file-border - File-row border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dropzone-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-surface-muted - Drop-region background.
 * @uses-token --fluid-surface-base - File-row background.
 * @uses-token --fluid-text-primary - File-row text.
 * @uses-token --fluid-text-secondary - Prompt + meta text.
 * @uses-token --fluid-border-default - Dashed border + file-row border.
 * @uses-token --fluid-accent-base - Dragover accent.
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-focus-ring-color - Keyboard focus ring.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum interactive-target size (24px AA / 44px AAA).
 *
 * @fires fluid-change - Fires when valid files are accepted. detail: { files: File[] }.
 * @fires fluid-reject - Fires when one or more files fail validation.
 *   detail: { files: File[]; reason: "type" | "size" }.
 */
export class FluidDropzone extends FluidElement {
  static override styles = [
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-space-3);
      }

      /*
       * The drop region is the interactive target (role=button). It floors on
       * --fluid-target-min so AAA lifts it to a comfortable 44px without any
       * per-component branching.
       */
      .dropzone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--fluid-space-2);
        min-height: max(7rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-space-6) var(--fluid-space-4);
        text-align: center;
        cursor: pointer;
        color: var(--fluid-dropzone-fg, var(--fluid-text-secondary));
        background-color: var(--fluid-dropzone-bg, var(--fluid-surface-muted));
        border: 2px dashed var(--fluid-dropzone-border, var(--fluid-border-default));
        border-radius: var(--fluid-dropzone-radius, var(--fluid-radius-md));
        transition:
          border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
          background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .dropzone:hover {
        border-color: var(--fluid-dropzone-accent, var(--fluid-accent-base));
      }

      .dropzone:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-dropzone-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }

      .dropzone.dragover {
        border-color: var(--fluid-dropzone-accent, var(--fluid-accent-base));
        border-style: solid;
        background-color: var(
          --fluid-dropzone-active-bg,
          color-mix(in srgb, var(--fluid-dropzone-accent, var(--fluid-accent-base)) 8%, var(--fluid-surface-muted))
        );
      }

      :host([disabled]) .dropzone {
        cursor: not-allowed;
        opacity: 0.5;
        pointer-events: none;
      }

      .icon {
        display: inline-flex;
        color: var(--fluid-dropzone-icon-color, var(--fluid-text-secondary));
      }

      .icon fluid-icon {
        width: 2rem;
        height: 2rem;
      }

      .label {
        font-size: var(--fluid-font-size-sm);
        line-height: var(--fluid-line-height-normal, 1.5);
      }

      .input {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-space-2);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .file {
        display: flex;
        align-items: center;
        gap: var(--fluid-space-3);
        padding: var(--fluid-space-2) var(--fluid-space-3);
        background-color: var(--fluid-dropzone-file-bg, var(--fluid-surface-base));
        color: var(--fluid-dropzone-file-fg, var(--fluid-text-primary));
        border: 1px solid var(--fluid-dropzone-file-border, var(--fluid-border-default));
        border-radius: var(--fluid-dropzone-radius, var(--fluid-radius-md));
      }

      .thumb {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--fluid-radius-sm);
        overflow: hidden;
        background-color: var(--fluid-dropzone-bg, var(--fluid-surface-muted));
        color: var(--fluid-dropzone-file-meta-fg, var(--fluid-text-secondary));
      }

      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumb fluid-icon {
        width: 1.25rem;
        height: 1.25rem;
      }

      .meta {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .name {
        font-size: var(--fluid-font-size-sm);
        font-weight: var(--fluid-font-weight-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .size {
        font-size: var(--fluid-font-size-xs);
        color: var(--fluid-dropzone-file-meta-fg, var(--fluid-text-secondary));
      }

      .remove {
        all: unset;
        flex-shrink: 0;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: max(1.75rem, var(--fluid-target-min, 0px));
        height: max(1.75rem, var(--fluid-target-min, 0px));
        cursor: pointer;
        border-radius: var(--fluid-radius-full);
        color: var(--fluid-dropzone-file-meta-fg, var(--fluid-text-secondary));
        transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .remove:hover {
        background: rgb(0 0 0 / 0.08);
        color: var(--fluid-dropzone-file-fg, var(--fluid-text-primary));
      }

      .remove:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-dropzone-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }

      .remove fluid-icon {
        width: 1rem;
        height: 1rem;
      }
    `,
    reducedMotion
  ];

  @query(".input") private inputEl!: HTMLInputElement;

  /** Comma-separated list of accepted file types (mirrors the native `accept`). */
  @property() accept = "";

  /** Allow selecting more than one file. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Maximum size per file, in bytes. 0 means no limit. */
  @property({ type: Number, attribute: "max-size" }) maxSize = 0;

  /** Disable the dropzone. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prompt text shown inside the drop region. */
  @property() label = "Drag files here or click to browse";

  /** The currently accepted files. */
  @state() private files: File[] = [];

  @state() private dragover = false;

  /** Read-only view of the accepted files. */
  get selectedFiles(): readonly File[] {
    return this.files;
  }

  private openDialog(): void {
    if (this.disabled) return;
    this.inputEl?.click();
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      this.openDialog();
    }
  };

  private handleInputChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.ingest(input.files);
    // Reset so selecting the same file again still fires a change.
    input.value = "";
  };

  private handleDragEnter = (e: DragEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this.dragover = true;
  };

  private handleDragOver = (e: DragEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    this.dragover = true;
  };

  private handleDragLeave = (e: DragEvent): void => {
    // Only clear when the pointer leaves the dropzone itself, not a child.
    if (e.currentTarget === e.target) {
      this.dragover = false;
    }
  };

  private handleDrop = (e: DragEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this.dragover = false;
    this.ingest(e.dataTransfer?.files ?? null);
  };

  private matchesAccept(file: File): boolean {
    const accept = this.accept.trim();
    if (!accept) return true;
    const patterns = accept
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (patterns.length === 0) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return patterns.some((pattern) => {
      if (pattern.startsWith(".")) {
        return name.endsWith(pattern);
      }
      if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, pattern.length - 1); // keep trailing slash
        return type.startsWith(prefix);
      }
      return type === pattern;
    });
  }

  private ingest(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;
    const incoming = this.multiple ? Array.from(fileList) : [fileList[0]];

    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];

    for (const file of incoming) {
      if (!file) continue;
      if (!this.matchesAccept(file)) {
        rejected.push({ file, reason: "type" });
        continue;
      }
      if (this.maxSize > 0 && file.size > this.maxSize) {
        rejected.push({ file, reason: "size" });
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      this.files = this.multiple ? [...this.files, ...accepted] : accepted;
      this.dispatchEvent(
        new CustomEvent("fluid-change", {
          detail: { files: this.files.slice() },
          bubbles: true,
          composed: true
        })
      );
    }

    if (rejected.length > 0) {
      // Group rejections so each reason is reported once.
      const byReason = new Map<FluidDropzoneRejectReason, File[]>();
      for (const { file, reason } of rejected) {
        const bucket = byReason.get(reason) ?? [];
        bucket.push(file);
        byReason.set(reason, bucket);
      }
      for (const [reason, files] of byReason) {
        this.dispatchEvent(
          new CustomEvent("fluid-reject", {
            detail: { files, reason },
            bubbles: true,
            composed: true
          })
        );
      }
    }
  }

  private removeFile(index: number): void {
    if (this.disabled) return;
    const next = this.files.slice();
    next.splice(index, 1);
    this.files = next;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: this.files.slice() },
        bubbles: true,
        composed: true
      })
    );
    // Return focus to the drop region so keyboard users are not stranded.
    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector<HTMLElement>(".dropzone")?.focus();
    });
  }

  /** Clear all selected files. Does not emit. */
  clear(): void {
    this.files = [];
  }

  private static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const unit = units[unitIndex] ?? "KB";
    return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${unit}`;
  }

  private renderFile(file: File, index: number): TemplateResult {
    const isImage = file.type.startsWith("image/");
    const thumbUrl = isImage ? URL.createObjectURL(file) : "";
    return html`
      <li part="file" class="file">
        <span part="thumb" class="thumb">
          ${isImage
            ? html`<img
                src=${thumbUrl}
                alt=""
                @load=${() => URL.revokeObjectURL(thumbUrl)}
              />`
            : html`<fluid-icon name="dropzone-file"></fluid-icon>`}
        </span>
        <span class="meta">
          <span class="name" title=${file.name}>${file.name}</span>
          <span class="size">${FluidDropzone.formatSize(file.size)}</span>
        </span>
        <button
          part="remove"
          class="remove"
          type="button"
          aria-label="Remove ${file.name}"
          ?disabled=${this.disabled}
          @click=${() => this.removeFile(index)}
        >
          <fluid-icon name="dropzone-remove"></fluid-icon>
        </button>
      </li>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <div
          part="dropzone"
          class="dropzone ${this.dragover ? "dragover" : ""}"
          role="button"
          tabindex=${this.disabled ? -1 : 0}
          aria-disabled=${this.disabled ? "true" : "false"}
          aria-label=${this.label}
          @click=${this.openDialog}
          @keydown=${this.handleKeydown}
          @dragenter=${this.handleDragEnter}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <span part="icon" class="icon">
            <fluid-icon name="upload-cloud"></fluid-icon>
          </span>
          <span part="label" class="label">
            <slot>${this.label}</slot>
          </span>
        </div>
        <!--
          The native picker lives outside the role="button" drop region so the
          two interactive controls are not nested (axe nested-interactive). It
          stays visually hidden and is triggered programmatically.
        -->
        <input
          class="input"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          accept=${this.accept}
          ?multiple=${this.multiple}
          ?disabled=${this.disabled}
          @change=${this.handleInputChange}
        />
        ${this.files.length > 0
          ? html`
              <ul part="list" class="list">
                ${repeat(
                  this.files,
                  (file, index) => `${file.name}-${file.size}-${index}`,
                  (file, index) => this.renderFile(file, index)
                )}
              </ul>
            `
          : ""}
      </div>
    `;
  }
}
