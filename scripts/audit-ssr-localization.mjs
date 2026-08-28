/** Read-only baseline: source DOM inheritance is not necessarily server inheritance. */
import { renderFluidToString } from "../packages/components/dist/ssr.js";
import { html } from "lit";
await import("../packages/components/dist/components/pagination/define.js");
const results = [];
for (const locale of ["nl", "de", "fr", "es", "ar"]) {
  const dictionary = (await import(`../packages/components/dist/locales/${locale}.js`)).default;
  const expected = dictionary.previousPage;
  if (typeof expected !== "string") throw new Error(`Missing expected translation: ${locale}`);
  const host = await renderFluidToString(
    html`<fluid-pagination lang=${locale} total="3"></fluid-pagination>`
  );
  const ancestor = await renderFluidToString(
    html`<div lang=${locale}><fluid-pagination total="3"></fluid-pagination></div>`
  );
  results.push({
    locale,
    expected,
    explicitHost: host.includes(`aria-label="${expected}"`),
    inheritedAncestor: ancestor.includes(`aria-label="${expected}"`)
  });
}
console.log(JSON.stringify({ scope: "built-pagination-SSR-language-baseline", results }, null, 2));
if (results.some((result) => !result.explicitHost || !result.inheritedAncestor))
  process.exitCode = 1;
