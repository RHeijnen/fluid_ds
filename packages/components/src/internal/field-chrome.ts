import { css, html, nothing, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

/**
 * Shared "field chrome" for form controls: an optional visible label above the
 * control and optional help text below it, rendered inside the control's own
 * shadow root.
 *
 * `fluid-field` remains the composition wrapper for rich content (slotted
 * labels, error messages, required indicators). This helper covers the common
 * case where a consumer just wants `label="Name" help-text="..."` directly on
 * the control, the way most component libraries allow. Because the label and
 * the control live in the same shadow root, the association is a real
 * `<label for>` reference, with no cross-boundary mirroring needed.
 *
 * Styling reuses the `--fluid-field-*` tokens documented on `fluid-field`, so
 * one override ladder themes both the wrapper component and this inline chrome.
 *
 * Ids are fixed (`field-label` / `field-help`): each control renders at most
 * one chrome, and ids are scoped to that control's shadow root.
 */

export const FIELD_HELP_ID = "field-help";

/** True when the given help text should render (and be referenced by aria-describedby). */
export const hasFieldHelp = (helpText: string): boolean => helpText.trim().length > 0;

/** `aria-describedby` value for a control whose chrome shows help text, else undefined. */
export const fieldHelpDescribedBy = (helpText: string): string | undefined =>
  hasFieldHelp(helpText) ? FIELD_HELP_ID : undefined;

export const fieldChromeStyles = css`
  .field-chrome {
    display: flex;
    flex-direction: column;
    gap: var(--fluid-field-gap, var(--fluid-space-1));
    width: 100%;
    min-width: 0;
  }

  .field-chrome-label {
    margin: 0;
    color: var(--fluid-field-label-fg, var(--fluid-text-primary));
    font-size: var(--fluid-field-label-font-size, var(--fluid-font-size-sm));
    font-weight: var(--fluid-field-label-font-weight, var(--fluid-font-weight-medium));
    line-height: var(--fluid-font-line-height-normal);
  }

  .field-chrome-help {
    margin: 0;
    color: var(--fluid-field-description-fg, var(--fluid-text-secondary));
    font-size: var(--fluid-field-description-font-size, var(--fluid-font-size-sm));
    line-height: var(--fluid-font-line-height-normal);
  }
`;

export interface FieldChromeOptions {
  /** Visible label text. Empty string renders no label row. */
  label: string;
  /** Help text below the control. Empty string renders no help row. */
  helpText: string;
  /** Id of the labelable element inside the same shadow root the label points at. */
  for?: string;
}

/**
 * Wrap a control's template with label and help rows. When neither is set the
 * control template is returned untouched, so existing markup and styling are
 * completely unaffected for consumers that do not use the feature.
 */
export function renderFieldChrome(
  options: FieldChromeOptions,
  control: TemplateResult
): TemplateResult {
  const label = options.label.trim();
  const help = options.helpText.trim();
  if (!label && !help) return control;
  return html`
    <div class="field-chrome">
      ${label
        ? html`<label class="field-chrome-label" part="label" for=${ifDefined(options.for)}
            >${label}</label
          >`
        : nothing}
      ${control}
      ${help
        ? html`<div class="field-chrome-help" part="help-text" id=${FIELD_HELP_ID}>${help}</div>`
        : nothing}
    </div>
  `;
}
