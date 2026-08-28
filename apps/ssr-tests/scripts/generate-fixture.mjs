import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const root = join(app, "..", "..");
const packagesRoot = join(root, "packages");
const debug = (message) => {
  if (process.env.SSR_FIXTURE_DEBUG === "1") console.log(message);
};

async function walk(dir, accept, output = [], sourceOnly = false) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || (sourceOnly && entry.name === "dist")) continue;
      await walk(file, accept, output, sourceOnly);
    } else if (accept(file)) output.push(file);
  }
  return output;
}

const { renderFluidToString } = await import(
  pathToFileURL(join(root, "packages/components/dist/ssr.js")).href
);
const { html } = await import("lit");
const { html: staticHtml, unsafeStatic } = await import("lit/static-html.js");

const tags = new Set();
const sourceFiles = await walk(packagesRoot, (file) => file.endsWith(".ts"), [], true);
debug(`Scanning ${sourceFiles.length} TypeScript files`);
const definitions = sourceFiles.filter((file) => !/\.(test|stories|d)\.ts$/.test(file));
for (let index = 0; index < definitions.length; index += 16) {
  await Promise.all(
    definitions.slice(index, index + 16).map(async (file) => {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(
        /customElements\.define\(\s*["'](fluid-[a-z0-9-]+)["']/g
      )) {
        tags.add(match[1]);
      }
    })
  );
}

const quality = JSON.parse(await readFile(join(root, "quality/component-quality.json"), "utf8"));
const canonicalTags = quality.components.map(({ tag }) => tag).sort();
assert.deepEqual(
  [...tags].sort(),
  canonicalTags,
  "SSR hydration fixture source inventory must exactly match the canonical quality catalog"
);

const registrationFiles = [];
for (const packageEntry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (!packageEntry.isDirectory()) continue;
  const dist = join(packagesRoot, packageEntry.name, "dist");
  try {
    registrationFiles.push(
      ...(await walk(
        dist,
        (file) => file.endsWith("define.js") || /[\\/]define[\\/][^\\/]+\.js$/.test(file)
      ))
    );
  } catch {
    // Packages without built element definitions are not part of this fixture.
  }
}
for (const file of registrationFiles) {
  debug(`Registering ${file}`);
  await import(pathToFileURL(file).href);
}
for (const locale of ["nl", "de", "fr", "es", "ar"]) {
  await import(pathToFileURL(join(root, `packages/components/dist/locales/${locale}.js`)).href);
}

// A valid local one-second PCM WAV avoids requesting an empty audio URI. Keep
// the catalog fixture deterministic and independent of external media services.
const silence = Buffer.alloc(44 + 8000, 128);
silence.write("RIFF", 0);
silence.writeUInt32LE(silence.length - 8, 4);
silence.write("WAVEfmt ", 8);
silence.writeUInt32LE(16, 16);
silence.writeUInt16LE(1, 20);
silence.writeUInt16LE(1, 22);
silence.writeUInt32LE(8000, 24);
silence.writeUInt32LE(8000, 28);
silence.writeUInt16LE(1, 32);
silence.writeUInt16LE(8, 34);
silence.write("data", 36);
silence.writeUInt32LE(8000, 40);
const audioSource = `data:audio/wav;base64,${silence.toString("base64")}`;

const hosts = [];
for (const tag of [...tags].sort()) {
  debug(`Rendering ${tag}`);
  const staticTag = unsafeStatic(tag);
  hosts.push(
    await renderFluidToString(
      tag === "fluid-audio"
        ? staticHtml`<${staticTag} src=${audioSource}></${staticTag}>`
        : staticHtml`<${staticTag}></${staticTag}>`
    )
  );
}
const stateful = await renderFluidToString(html`
  <form id="hydration-form">
    <fluid-input
      id="stateful"
      name="note"
      label="Server input"
      value="server"
      required
    ></fluid-input>
    <fluid-checkbox id="choice" name="remember" value="yes" checked required
      >Remember me</fluid-checkbox
    >
    <fluid-input
      id="amount"
      name="amount"
      label="Amount"
      type="number"
      value="2"
      min="1"
      required
    ></fluid-input>
    <fluid-input
      id="contact"
      name="contact"
      label="Email"
      type="email"
      value="fluid@example.com"
      required
    ></fluid-input>
    <fluid-button id="action" type="submit">Hydrated action</fluid-button>
    <button type="reset">Reset form</button>
  </form>
  <form id="adoption-form">
    <fluid-masked-input
      id="adopt-masked"
      name="masked"
      value="server mask"
      aria-label="Masked"
    ></fluid-masked-input>
    <fluid-number-input
      id="adopt-number"
      name="quantity"
      value="2"
      aria-label="Quantity"
    ></fluid-number-input>
    <fluid-slider
      id="adopt-slider"
      name="volume"
      value="20"
      min="0"
      max="100"
      aria-label="Volume"
    ></fluid-slider>
    <fluid-switch id="adopt-switch" name="alerts" value="enabled">Alerts</fluid-switch>
    <fluid-textarea
      id="adopt-textarea"
      name="notes"
      value="server notes"
      aria-label="Notes"
    ></fluid-textarea>
    <fluid-typeahead
      id="adopt-typeahead"
      name="city"
      value="Amsterdam"
      aria-label="City"
    ></fluid-typeahead>
  </form>
  <form id="composite-adoption-form">
    <fluid-color-picker
      id="adopt-color"
      name="color"
      value="#000000"
      aria-label="Color"
    ></fluid-color-picker>
    <fluid-date-picker id="adopt-date" name="date" value="2026-08-27"></fluid-date-picker>
    <fluid-date-range-picker
      id="adopt-date-range"
      name="range"
      start="2026-08-27"
      end="2026-08-28"
      typeable
    ></fluid-date-range-picker>
    <fluid-otp id="adopt-otp" name="code" length="4"></fluid-otp>
    <fluid-tag-input id="adopt-tags" name="tags" value="alpha,beta"></fluid-tag-input>
    <fluid-time-picker id="adopt-time" name="time" value="09:30"></fluid-time-picker>
  </form>
  <section id="locale-context" lang="nl">
    <fluid-pagination id="localized-pagination" total="3"></fluid-pagination>
  </section>
`);
const catalogMarkup = hosts.join("\n");
const expectedShadowRoots =
  (catalogMarkup.match(/shadowrootmode="open"/g) ?? []).length +
  (stateful.match(/shadowrootmode="open"/g) ?? []).length;

await writeFile(
  join(app, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="fluid-ssr-catalog-count" content="${tags.size}">
    <meta name="fluid-ssr-shadow-root-count" content="${expectedShadowRoots}">
    <title>Fluid SSR hydration fixture</title>
  </head>
  <body>
    <main>
      <section id="state-fixture">${stateful}</section>
      <section id="catalog" hidden>${catalogMarkup}</section>
    </main>
    <script type="module" src="/src/client.ts"></script>
  </body>
</html>
`,
  "utf8"
);
console.log(`Generated browser hydration fixture for ${tags.size} elements.`);
