import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const components = join(app, "../../packages/components/dist");
const scheduler = join(app, "../../packages/scheduler/dist");
const output = join(app, "generated/form-focus");
const names = [
  "input",
  "checkbox",
  "switch",
  "textarea",
  "number-input",
  "typeahead",
  "masked-input",
  "select",
  "time-picker",
  "date-picker",
  "color-picker",
  "file-input",
  "otp",
  "radio-group",
  "date-range-picker",
  "scheduler"
];
const { renderFluidToString } = await import(pathToFileURL(join(components, "ssr.js")).href);
const { html: staticHtml, unsafeStatic } = await import("lit/static-html.js");
for (const name of ["button", ...names]) {
  if (name === "scheduler") {
    await import(pathToFileURL(join(scheduler, "components", "scheduler", "define.js")).href);
    continue;
  }
  const definition = name === "radio-group" ? "radio" : name;
  await import(pathToFileURL(join(components, "components", definition, "define.js")).href);
}
await mkdir(output, { recursive: true });

for (const name of names) {
  const tag = `fluid-${name}`;
  const staticTag = unsafeStatic(tag);
  const toggle = name === "checkbox" || name === "switch";
  const label = `${name} value`;
  const schedulerAvailability = JSON.stringify({
    weekly: Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((day) => [day, [{ start: "09:00", end: "17:00" }]])
    ),
    slotMinutes: 60,
    maxAdvanceDays: 30
  });
  const field =
    name === "scheduler"
      ? staticHtml`<fluid-scheduler id="field" name="answer" aria-label="Appointment" availability=${schedulerAvailability} required></fluid-scheduler>`
      : name === "date-range-picker"
      ? staticHtml`<fluid-date-range-picker id="field" name="answer" aria-label="Travel dates" format="iso" required></fluid-date-range-picker>`
      : name === "radio-group"
      ? staticHtml`<fieldset id="field-shell"><legend>Delivery speed</legend><fluid-radio-group id="field" name="answer" aria-label="Delivery speed" required><fluid-radio value="unavailable" disabled>Unavailable</fluid-radio><fluid-radio value="standard">Standard</fluid-radio><fluid-radio value="express">Express</fluid-radio></fluid-radio-group></fieldset>`
      : name === "otp"
      ? staticHtml`<fluid-otp id="field" name="answer" aria-label="Verification code" length="4" required></fluid-otp>`
      : name === "color-picker"
      ? staticHtml`<fluid-color-picker id="field" name="answer" aria-label="Accent" value="" palette='["#ff0000","#00ff00"]' required></fluid-color-picker>`
      : name === "masked-input"
        ? staticHtml`<fluid-masked-input id="field" name="answer" aria-label="Masked value" mask="##/##" required></fluid-masked-input>`
        : name === "select"
          ? staticHtml`<fluid-select id="field" name="answer" label="Select value" required><fluid-option value="apple">Apple</fluid-option><fluid-option value="banana">Banana</fluid-option></fluid-select>`
          : name === "time-picker"
            ? staticHtml`<fluid-time-picker id="field" name="answer" label="Time value" min="09:00" max="10:00" step="30" format="12h" required></fluid-time-picker>`
            : name === "date-picker"
              ? staticHtml`<fluid-date-picker id="field" name="answer" label="Date value" format="iso" min="2026-08-01" max="2026-08-31" required></fluid-date-picker>`
              : toggle
                ? staticHtml`<${staticTag} id="field" name="answer" value="accepted" required>${label}</${staticTag}>`
                : staticHtml`<${staticTag} id="field" name="answer" label=${label} required></${staticTag}>`;
  const serverForm = await renderFluidToString(staticHtml`
    <form id="native-form">
      <div class="actions">
        <button id="native-submit" type="submit">Native submit</button>
        <fluid-button id="fluid-submit" type="submit">Fluid submit</fluid-button>
      </div>
      ${field}
    </form>
  `);
  const clientField =
    name === "scheduler"
      ? `<fluid-scheduler id="field" name="answer" aria-label="Appointment" availability='${schedulerAvailability}' required></fluid-scheduler>`
      : name === "date-range-picker"
      ? '<fluid-date-range-picker id="field" name="answer" aria-label="Travel dates" format="iso" required></fluid-date-range-picker>'
      : name === "radio-group"
      ? '<fieldset id="field-shell"><legend>Delivery speed</legend><fluid-radio-group id="field" name="answer" aria-label="Delivery speed" required><fluid-radio value="unavailable" disabled>Unavailable</fluid-radio><fluid-radio value="standard">Standard</fluid-radio><fluid-radio value="express">Express</fluid-radio></fluid-radio-group></fieldset>'
      : name === "otp"
      ? '<fluid-otp id="field" name="answer" aria-label="Verification code" length="4" required></fluid-otp>'
      : name === "color-picker"
      ? '<fluid-color-picker id="field" name="answer" aria-label="Accent" value="" palette=\'["#ff0000","#00ff00"]\' required></fluid-color-picker>'
      : name === "masked-input"
        ? '<fluid-masked-input id="field" name="answer" aria-label="Masked value" mask="##/##" required></fluid-masked-input>'
        : name === "select"
          ? '<fluid-select id="field" name="answer" label="Select value" required><fluid-option value="apple">Apple</fluid-option><fluid-option value="banana">Banana</fluid-option></fluid-select>'
          : name === "time-picker"
            ? '<fluid-time-picker id="field" name="answer" label="Time value" min="09:00" max="10:00" step="30" format="12h" required></fluid-time-picker>'
            : name === "date-picker"
              ? '<fluid-date-picker id="field" name="answer" label="Date value" format="iso" min="2026-08-01" max="2026-08-31" required></fluid-date-picker>'
              : toggle
                ? `<${tag} id="field" name="answer" value="accepted" required>${label}</${tag}>`
                : `<${tag} id="field" name="answer" label="${label}" required></${tag}>`;
  const clientForm = `<form id="native-form"><div class="actions"><button id="native-submit" type="submit">Native submit</button><fluid-button id="fluid-submit" type="submit">Fluid submit</fluid-button></div>${clientField}</form>`;
  for (const mode of ["client", "dsd"]) {
    await writeFile(
      join(output, `${name}-${mode}.html`),
      `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fluid native form focus</title>
<style>body { margin: 24px; max-width: 640px; } .actions { display: flex; gap: 16px; margin-bottom: 24px; }</style></head>
<body data-field="${tag}" data-render-mode="${mode}"><main>${mode === "dsd" ? serverForm : clientForm}</main>
<script type="module" src="/src/form-focus-client.ts"></script></body></html>`,
      "utf8"
    );
  }
}
console.log(`Generated ${names.length * 2} isolated native form-focus fixtures.`);
