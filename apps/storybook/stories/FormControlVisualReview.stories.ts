import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/button-group";
import "@fluid-ds/components/define/calendar";
import "@fluid-ds/components/define/checkbox";
import "@fluid-ds/components/define/color-picker";
import "@fluid-ds/components/define/date-picker";
import "@fluid-ds/components/define/date-range-picker";
import "@fluid-ds/components/define/dropzone";
import "@fluid-ds/components/define/field";
import "@fluid-ds/components/define/fieldset";
import "@fluid-ds/components/define/file-input";
import "@fluid-ds/components/define/form";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/masked-input";
import "@fluid-ds/components/define/number-input";
import "@fluid-ds/components/define/otp";
import "@fluid-ds/components/define/radio";
import "@fluid-ds/components/define/range-slider";
import "@fluid-ds/components/define/rating";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/signature-pad";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tag-input";
import "@fluid-ds/components/define/textarea";
import "@fluid-ds/components/define/time-picker";
import "@fluid-ds/components/define/transfer";
import "@fluid-ds/components/define/typeahead";

const meta: Meta = {
  title: "Reviews/Form controls",
  parameters: {
    controls: { disable: true },
    layout: "padded",
    status: { type: "experimental" }
  }
};

export default meta;
type Story = StoryObj;

const transferItems = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" }
];

const reviewStyles = html`
  <style>
    .review {
      color: var(--fluid-text-primary);
      font-family: var(--fluid-font-family-sans);
      min-width: 0;
    }
    .review h1 {
      font-size: var(--fluid-font-size-xl);
      margin: 0 0 var(--fluid-space-2);
    }
    .intro {
      color: var(--fluid-text-secondary);
      margin: 0 0 var(--fluid-space-6);
      max-width: 72rem;
    }
    .review-section {
      border-block-start: var(--fluid-field-border-width) solid var(--fluid-border-default);
      margin-block-start: var(--fluid-space-6);
      padding-block-start: var(--fluid-space-4);
    }
    .review-section h2 {
      font-size: var(--fluid-font-size-md);
      margin: 0 0 var(--fluid-space-1);
    }
    .review-section > p {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
      margin: 0 0 var(--fluid-space-4);
    }
    .rail-scroll {
      overflow-x: auto;
      padding-block: var(--fluid-space-1) var(--fluid-space-4);
    }
    .rail {
      align-items: flex-start;
      display: flex;
      gap: var(--fluid-space-12, 3rem);
      min-width: max-content;
    }
    .control-card {
      flex: 0 0 13rem;
      min-width: 0;
    }
    .control-card.wide {
      flex-basis: 20rem;
    }
    .control-card.x-wide {
      flex-basis: 28rem;
    }
    .control-label {
      color: var(--fluid-text-secondary);
      display: block;
      font-size: var(--fluid-font-size-xs);
      font-weight: 700;
      height: 1.25rem;
      letter-spacing: 0.04em;
      margin-block-end: var(--fluid-space-2);
      text-transform: uppercase;
    }
    .control-slot {
      align-items: flex-start;
      display: flex;
      min-height: 2.375rem;
    }
    .parity .control-slot {
      align-items: center;
    }
    .control-slot > :first-child {
      max-width: 100%;
      width: 100%;
    }
    .measurement {
      color: var(--fluid-text-secondary);
      display: block;
      font-size: var(--fluid-font-size-xs);
      font-variant-numeric: tabular-nums;
      margin-block-start: var(--fluid-space-2);
    }
    .control-card[data-height-state="mismatch"] .measurement {
      color: var(--fluid-danger-base);
      font-weight: 700;
    }
    .compact .control-card {
      flex-basis: 15rem;
    }
    .compact .control-slot,
    .composite .control-slot,
    .structure .control-slot {
      min-height: 0;
    }
    .structure fluid-field,
    .structure fluid-fieldset,
    .structure fluid-form {
      width: 100%;
    }
  </style>
`;

function card(label: string, control: unknown, classes = "") {
  return html`
    <div class="control-card ${classes}">
      <span class="control-label">${label}</span>
      <div class="control-slot">${control}</div>
      <span class="measurement" aria-live="polite"></span>
    </div>
  `;
}

async function measureParity(canvasElement: HTMLElement) {
  const controls = [...canvasElement.querySelectorAll<HTMLElement>("[data-review-control]")];
  await Promise.all(
    controls.map(async (control) => {
      await customElements.whenDefined(control.localName);
      const updateComplete = (control as HTMLElement & { updateComplete?: Promise<unknown> })
        .updateComplete;
      if (updateComplete) await updateComplete;
    })
  );

  const reference = controls.find((control) => control.localName === "fluid-input");
  const referenceHeight = reference?.getBoundingClientRect().height ?? 0;
  for (const control of controls) {
    const height = control.getBoundingClientRect().height;
    const owner = control.closest<HTMLElement>(".control-card")!;
    if (control.dataset.reviewControl === "action") {
      owner.dataset.heightState = "action";
      owner.querySelector<HTMLElement>(".measurement")!.textContent =
        `${Math.round(height)}px · centered action`;
      continue;
    }
    const mismatch = Math.abs(height - referenceHeight) > 0.5;
    owner.dataset.heightState = mismatch ? "mismatch" : "match";
    owner.querySelector<HTMLElement>(".measurement")!.textContent =
      `${Math.round(height)}px${mismatch ? ` · expected ${Math.round(referenceHeight)}px` : " · aligned"}`;
  }
}

export const CompleteFormFlow: Story = {
  render: () => html`
    ${reviewStyles}
    <main class="review">
      <h1>Complete form-control flow</h1>
      <p class="intro">
        Existing Fluid components rendered together. The first rail is a strict height contract:
        every medium single-line control should match Input. Red measurements identify drift. Other
        rails compare baseline, target size, and spacing without forcing unlike controls to share a
        height.
      </p>

      <section class="review-section parity">
        <h2>Single-line controls · strict 38px parity</h2>
        <p>One horizontal form row; scroll sideways to inspect every control without wrapping.</p>
        <div class="rail-scroll">
          <div class="rail">
            ${card(
              "Input",
              html`<fluid-input
                data-review-control="field"
                aria-label="Name"
                value="Ada"
              ></fluid-input>`
            )}
            ${card(
              "Masked input",
              html`<fluid-masked-input
                data-review-control="field"
                aria-label="Phone"
                mask="(###) ###-####"
                value="2025550123"
              ></fluid-masked-input>`
            )}
            ${card(
              "NumberInput",
              html`<fluid-number-input
                data-review-control="field"
                aria-label="Quantity"
                value="5"
                min="0"
                max="100"
              ></fluid-number-input>`
            )}
            ${card(
              "Select",
              html`<fluid-select data-review-control="field" aria-label="Country" value="nl"
                ><fluid-option value="nl">Netherlands</fluid-option
                ><fluid-option value="be">Belgium</fluid-option></fluid-select
              >`
            )}
            ${card(
              "Typeahead",
              html`<fluid-typeahead
                data-review-control="field"
                aria-label="Fruit"
                value="Apple"
                options='["Apple","Banana"]'
              ></fluid-typeahead>`
            )}
            ${card(
              "Date picker",
              html`<fluid-date-picker
                data-review-control="field"
                aria-label="Date"
                value="2026-06-15"
                size="md"
              ></fluid-date-picker>`
            )}
            ${card(
              "Date range picker",
              html`<fluid-date-range-picker
                data-review-control="field"
                aria-label="Date range"
                start="2026-06-08"
                end="2026-06-19"
              ></fluid-date-range-picker>`,
              "wide"
            )}
            ${card(
              "Time picker",
              html`<fluid-time-picker
                data-review-control="field"
                aria-label="Time"
                value="09:30"
                size="md"
              ></fluid-time-picker>`
            )}
            ${card(
              "Color picker",
              html`<fluid-color-picker
                data-review-control="field"
                aria-label="Color"
                value="#3b82f6"
              ></fluid-color-picker>`
            )}
            ${card(
              "Button",
              html`<fluid-button data-review-control="action" size="md">Submit</fluid-button>`
            )}
          </div>
        </div>
      </section>

      <section class="review-section compact">
        <h2>Compact choice and value controls</h2>
        <p>
          Compare baselines, spacing, and pointer-target rhythm; these are not field-chrome peers.
        </p>
        <div class="rail-scroll">
          <div class="rail">
            ${card("Checkbox", html`<fluid-checkbox checked>Agree</fluid-checkbox>`)}
            ${card("Switch", html`<fluid-switch checked>Notifications</fluid-switch>`)}
            ${card(
              "Radio group",
              html`<fluid-radio-group orientation="horizontal" value="md" aria-label="Size"
                ><fluid-radio value="sm">S</fluid-radio><fluid-radio value="md">M</fluid-radio
                ><fluid-radio value="lg">L</fluid-radio></fluid-radio-group
              >`,
              "wide"
            )}
            ${card(
              "Rating",
              html`<fluid-rating value="3" max="5" aria-label="Rating"></fluid-rating>`
            )}
            ${card(
              "Slider",
              html`<fluid-slider
                value="50"
                min="0"
                max="100"
                show-value
                aria-label="Volume"
              ></fluid-slider>`,
              "wide"
            )}
            ${card(
              "Range slider",
              html`<fluid-range-slider
                min="0"
                max="100"
                value-min="25"
                value-max="75"
                aria-label="Range"
              ></fluid-range-slider>`,
              "wide"
            )}
            ${card(
              "ButtonGroup",
              html`<fluid-button-group aria-label="Format"
                ><fluid-button variant="secondary">Bold</fluid-button
                ><fluid-button variant="secondary">Italic</fluid-button></fluid-button-group
              >`,
              "wide"
            )}
            ${card(
              "SegmentedControl",
              html`<fluid-segmented-control value="light" aria-label="Theme"
                ><fluid-segment value="light">Light</fluid-segment
                ><fluid-segment value="dark">Dark</fluid-segment></fluid-segmented-control
              >`,
              "wide"
            )}
          </div>
        </div>
      </section>

      <section class="review-section composite">
        <h2>Multiline and composite controls</h2>
        <p>Compare internal spacing, label rhythm, and visual weight in one continuous rail.</p>
        <div class="rail-scroll">
          <div class="rail">
            ${card(
              "Textarea",
              html`<fluid-textarea aria-label="Comment" rows="4"></fluid-textarea>`,
              "wide"
            )}
            ${card(
              "Tag input",
              html`<fluid-tag-input aria-label="Tags" value="react,typescript"></fluid-tag-input>`,
              "wide"
            )}
            ${card("OTP input", html`<fluid-otp length="6" value="123"></fluid-otp>`, "wide")}
            ${card(
              "FileInput",
              html`<fluid-file-input aria-label="Files"></fluid-file-input>`,
              "wide"
            )}
            ${card(
              "Dropzone",
              html`<fluid-dropzone aria-label="Drop files"></fluid-dropzone>`,
              "wide"
            )}
            ${card(
              "Signature pad",
              html`<fluid-signature-pad aria-label="Signature"></fluid-signature-pad>`,
              "x-wide"
            )}
            ${card(
              "Calendar",
              html`<fluid-calendar value="2026-06-15"></fluid-calendar>`,
              "x-wide"
            )}
            ${card(
              "Transfer",
              html`<fluid-transfer
                source-label="Available"
                target-label="Selected"
                .items=${transferItems}
                .value=${["vue"]}
              ></fluid-transfer>`,
              "x-wide"
            )}
          </div>
        </div>
      </section>

      <section class="review-section structure">
        <h2>Form structure components</h2>
        <p>Field, Fieldset, and Form are layout owners, so they are reviewed separately.</p>
        <div class="rail-scroll">
          <div class="rail">
            ${card(
              "Field",
              html`<fluid-field label="Email" description="Work address" for="review-email"
                ><fluid-input id="review-email" type="email" value="ada@example.com"></fluid-input
              ></fluid-field>`,
              "wide"
            )}
            ${card(
              "Fieldset",
              html`<fluid-fieldset legend="Contact preference"
                ><fluid-checkbox checked>Email</fluid-checkbox
                ><fluid-checkbox>SMS</fluid-checkbox></fluid-fieldset
              >`,
              "wide"
            )}
            ${card(
              "Form",
              html`<fluid-form
                ><label>Name <input name="name" value="Ada" /></label
                ><button slot="actions" type="submit">Save</button></fluid-form
              >`,
              "wide"
            )}
          </div>
        </div>
      </section>
    </main>
  `,
  play: async ({ canvasElement }) => measureParity(canvasElement)
};
