import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSignaturePad } from "./fluid-signature-pad.js";

type Args = Pick<
  FluidSignaturePad,
  "placeholder" | "disabled" | "clearLabel" | "undoLabel" | "uploadLabel" | "fitLabel"
>;

/** A small inline signature graphic, used to pre-fill the pad in stories. */
const SAMPLE_SIGNATURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80">
      <path d="M12 58 C 30 12, 44 12, 50 44 C 54 62, 60 62, 68 40 C 76 20, 84 24, 88 44
        C 92 60, 100 58, 112 38 C 120 26, 128 30, 130 44 C 133 58, 142 56, 152 42
        C 162 30, 176 30, 184 40 C 192 50, 202 48, 210 38"
        fill="none" stroke="#1c2733" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  );

const meta: Meta<Args> = {
  title: "Components/Forms/Signature pad",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    placeholder: { control: "text", description: "Invitation shown while the pad is empty." },
    disabled: { control: "boolean" },
    clearLabel: { control: "text" },
    undoLabel: { control: "text" },
    uploadLabel: { control: "text" },
    fitLabel: { control: "text" }
  },
  args: {
    placeholder: "Sign here",
    disabled: false,
    clearLabel: "Clear",
    undoLabel: "Undo",
    uploadLabel: "Upload",
    fitLabel: "Fit"
  },
  render: (args) => html`
    <fluid-signature-pad
      placeholder=${args.placeholder}
      clear-label=${args.clearLabel}
      undo-label=${args.undoLabel}
      upload-label=${args.uploadLabel}
      fit-label=${args.fitLabel}
      ?disabled=${args.disabled}
      aria-label="Signature"
    ></fluid-signature-pad>
  `
};

export default meta;
type Story = StoryObj<Args>;

function storyAssert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Draw with a mouse, pen, or finger; Undo and Clear appear once signed. */
export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true }
};

/**
 * A prepared signature placed instead of drawn (the Upload button and dropping
 * an image call the same `placeImage` method). The placed layer stays
 * adjustable: drag it to move, pull the corner grip to scale, Fit to re-center.
 */
export const PlacedImage: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-signature-pad" } },
  play: async ({ canvasElement }) => {
    const pad = canvasElement.querySelector<FluidSignaturePad>("fluid-signature-pad");
    if (!pad) throw new Error("Signature contract fixture is missing");
    await pad.updateComplete;
    const changes: Array<{ signed: boolean; strokes: number }> = [];
    const onChange = (event: Event) => {
      changes.push((event as CustomEvent<{ signed: boolean; strokes: number }>).detail);
    };
    pad.addEventListener("fluid-change", onChange);
    try {
      await pad.placeImage(SAMPLE_SIGNATURE);
      await pad.updateComplete;
      storyAssert(pad.signed, "Signature was not signed after placing image");
      storyAssert(/^data:image\/png;base64,/.test(pad.toDataURL() ?? ""), "Signature did not export a PNG");
      storyAssert(changes.length === 1 && changes[0]?.signed === true && changes[0]?.strokes === 0, "Image placement must emit exactly one signed change");
      const clearHost = [...pad.shadowRoot!.querySelectorAll("fluid-button")].find((button) => button.textContent?.trim() === pad.clearLabel);
      const clear = clearHost?.shadowRoot?.querySelector("button");
      if (!clear || clear.disabled) throw new Error("Signature Clear control is unavailable");
      // A DOM activation contract; trusted pointer drawing is covered separately.
      clear.click();
      await pad.updateComplete;
      storyAssert(!pad.signed && pad.toDataURL() === undefined, "Clear did not remove the signature");
      storyAssert(changes.length === 2 && changes[1]?.signed === false && changes[1]?.strokes === 0, "Clear must emit exactly one empty change");
      // Preserve the prepared-image story's final visual state after exercising Clear.
      await pad.placeImage(SAMPLE_SIGNATURE);
      await pad.updateComplete;
      storyAssert(pad.signed && changes.length === 3, "Signature could not be placed again after Clear");
    } finally {
      pad.removeEventListener("fluid-change", onChange);
    }
  }
};

/** Copy comes in through properties, so any language works out of the box. */
export const LocalizedLabels: Story = {
  args: {
    placeholder: "Hier tekenen",
    clearLabel: "Wissen",
    undoLabel: "Ongedaan maken",
    uploadLabel: "Uploaden",
    fitLabel: "Passend"
  }
};

/**
 * The component-scoped tokens: ink color, surface, height, and the widest the
 * pad will draw, all override per instance.
 */
export const CustomTokens: Story = {
  render: () => html`
    <fluid-signature-pad
      aria-label="Signature in blue ink"
      style="
        --fluid-signature-pad-ink: #1d4ed8;
        --fluid-signature-pad-height: 7rem;
        --fluid-signature-pad-max-width: 24rem;
        --fluid-signature-pad-border: #1d4ed8;
      "
    ></fluid-signature-pad>
  `
};

/**
 * Form-associated: the submitted value is a PNG data URL of the ink, empty
 * while nothing has been drawn. Reset clears the pad.
 */
export const InAForm: Story = {
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 32rem;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        const value = String(data.get("signature") ?? "");
        alert(value ? `Submitted a ${value.length}-character PNG data URL` : "No signature yet");
      }}
    >
      <fluid-signature-pad name="signature" aria-label="Signature"></fluid-signature-pad>
      <div style="display:flex; gap: var(--fluid-space-2);">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </form>
  `
};

/** `fluid-change` reports whether ink remains and how many strokes there are. */
export const ChangeEvents: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <fluid-signature-pad
        aria-label="Signature"
        @fluid-change=${(e: CustomEvent<{ signed: boolean; strokes: number }>) => {
          const out = document.getElementById("signature-pad-status");
          if (out) {
            out.textContent = e.detail.signed ? `Signed, ${e.detail.strokes} stroke(s)` : "Empty";
          }
        }}
      ></fluid-signature-pad>
      <p id="signature-pad-status" style="margin: 0; color: var(--fluid-text-secondary);">Empty</p>
    </div>
  `
};
