/**
 * QR studio demo: design a @fluid-ds/qr code live. Every control on the
 * left writes straight onto the <fluid-qr-code> element; the code re-renders
 * as crisp SVG on each change, including the logo-embedded fancy mode.
 */
import "./shared/register-fluid.js";
import "@fluid-ds/qr/define";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "QR studio", currentRoute: "qr" });
mountDesignOverlay();

/** Inline SVG logo, so the fancy mode needs no network. */
const LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="#0284c7"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M-3,20 C6,15 13,25 22,20 S36,15 51,20" opacity="0.95"/><path d="M-3,29 C6,24 13,34 22,29 S36,24 51,29" opacity="0.65"/><path d="M-3,38 C6,33 13,43 22,38 S36,33 51,38" opacity="0.35"/></g></svg>`
  );

main.innerHTML = `
  <section class="demo-page fluid-glass-panel">
    <header class="demo-page-head">
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
        <fluid-breadcrumb-item current>QR studio</fluid-breadcrumb-item>
      </fluid-breadcrumb>
      <h1>Design a code</h1>
      <p class="muted-lead">
        <code>&lt;fluid-qr-code&gt;</code> renders as SVG, so every tweak stays crisp at any size.
        Adding the logo bumps error correction to H automatically so the code still scans.
      </p>
    </header>

    <div class="demo-two-col">
      <fluid-card>
        <h3 slot="header">Controls</h3>
        <div class="qr-controls">
          <fluid-input id="qr-value" label="Content" value="https://fluid-web.dev/"></fluid-input>
          <label class="qr-field">
            <span>Size</span>
            <fluid-slider id="qr-size" min="120" max="320" step="10" value="220" aria-label="Size"></fluid-slider>
          </label>
          <label class="qr-field">
            <span>Modules</span>
            <fluid-segmented-control id="qr-modules" value="rounded" aria-label="Module shape">
              <fluid-segment value="square">Square</fluid-segment>
              <fluid-segment value="dots">Dots</fluid-segment>
              <fluid-segment value="rounded">Rounded</fluid-segment>
            </fluid-segmented-control>
          </label>
          <label class="qr-field">
            <span>Eyes</span>
            <fluid-segmented-control id="qr-eyes" value="rounded" aria-label="Eye shape">
              <fluid-segment value="square">Square</fluid-segment>
              <fluid-segment value="rounded">Rounded</fluid-segment>
              <fluid-segment value="circle">Circle</fluid-segment>
            </fluid-segmented-control>
          </label>
          <div class="qr-colors">
            <label class="qr-field"><span>Fill</span><fluid-color-picker id="qr-fill" value="#1e293b" aria-label="Fill color"></fluid-color-picker></label>
            <label class="qr-field"><span>Eye color</span><fluid-color-picker id="qr-eye-color" value="#0284c7" aria-label="Eye color"></fluid-color-picker></label>
          </div>
          <label class="qr-field qr-field-row">
            <fluid-switch id="qr-logo"></fluid-switch>
            <span>Center logo (auto error-correction H)</span>
          </label>
        </div>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Preview</h3>
        <div class="qr-stage">
          <fluid-qr-code
            id="qr-code"
            value="https://fluid-web.dev/"
            size="220"
            module-shape="rounded"
            eye-shape="rounded"
            fill="#1e293b"
            eye-color="#0284c7"
          ></fluid-qr-code>
        </div>
      </fluid-card>
    </div>
  </section>
`;

const code = document.getElementById("qr-code")!;

/* Workaround for a segmented-control init race on connected innerHTML parse:
   the control can fall back to its first segment before the segments upgrade,
   so re-assert the intended values via the property once everything is live. */
requestAnimationFrame(() => {
  (document.getElementById("qr-modules") as HTMLElement & { value?: string }).value = "rounded";
  (document.getElementById("qr-eyes") as HTMLElement & { value?: string }).value = "rounded";
});
const setAttr = (name: string, value: string): void => {
  if (value) code.setAttribute(name, value);
  else code.removeAttribute(name);
};
const detailValue = (event: Event): string => String((event as CustomEvent).detail?.value ?? "");

document.getElementById("qr-value")?.addEventListener("fluid-input", (event) => {
  setAttr("value", detailValue(event) || "https://fluid-web.dev/");
});
document.getElementById("qr-size")?.addEventListener("fluid-input", (event) => {
  setAttr("size", detailValue(event));
});
document.getElementById("qr-modules")?.addEventListener("fluid-change", (event) => {
  setAttr("module-shape", detailValue(event));
});
document.getElementById("qr-eyes")?.addEventListener("fluid-change", (event) => {
  setAttr("eye-shape", detailValue(event));
});
document.getElementById("qr-fill")?.addEventListener("fluid-input", (event) => {
  setAttr("fill", detailValue(event));
});
document.getElementById("qr-eye-color")?.addEventListener("fluid-input", (event) => {
  setAttr("eye-color", detailValue(event));
});
document.getElementById("qr-logo")?.addEventListener("fluid-change", (event) => {
  const on = Boolean((event as CustomEvent).detail?.checked);
  setAttr("logo", on ? LOGO : "");
});
