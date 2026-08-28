import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertRequestCachePolicy,
  requestTimeConfig,
  requestTimePage
} from "./check-framework-next-request-time.mjs";

const staticPage = `export const dynamic = "force-static";
export default async function SsrContractPage() {
  const serverContract = html\`<fluid-card id="contract-card"></fluid-card>\`;
  return (<section aria-label="Packed SSR contract"><div dangerouslySetInnerHTML={{ __html: serverContract }} /></section>);
}`;

test("request-time fixture conversion fails closed and injects request-owned markup", () => {
  const dynamic = requestTimePage(staticPage);
  assert.match(dynamic, /force-dynamic/);
  assert.match(dynamic, /await import\("next\/headers"\)/);
  assert.match(dynamic, /data-request-id=\{requestId\}/);
  assert.match(dynamic, /<span id="fluid-request-marker">\$\{requestId\}<\/span>/);
  assert.match(dynamic, /html`<span id="fluid-request-marker">\$\{requestId\}<\/span><fluid-card/);
  assert.throws(() => requestTimePage(dynamic), /force-static/);
  assert.throws(
    () => requestTimePage(staticPage.replace('<fluid-card id="contract-card">', "<fluid-card>")),
    /contract-card/
  );
});

test("the retained Next page is converted with a Lit-rendered request marker", () => {
  const retained = readFileSync(
    new URL("./fixtures/framework-pinned/next/fixture/app/ssr-contract/page.tsx", import.meta.url),
    "utf8"
  );
  const dynamic = requestTimePage(retained);
  assert.match(
    dynamic,
    /html`[\s\S]*<span id="fluid-request-marker">\$\{requestId\}<\/span><fluid-card/
  );
});

test("request-time config removes only the static-export directive", () => {
  assert.equal(
    requestTimeConfig('const config = {\n  output: "export",\n  trailingSlash: true\n};'),
    "const config = {\n  trailingSlash: true\n};"
  );
  assert.throws(() => requestTimeConfig("const config = {};"), /output: "export"/);
});

test("request-time responses require private/no-store policy without public cache tokens", () => {
  assert.doesNotThrow(() =>
    assertRequestCachePolicy("private, no-cache, no-store, max-age=0, must-revalidate")
  );
  assert.doesNotThrow(() => assertRequestCachePolicy("no-store"));
  assert.throws(() => assertRequestCachePolicy("public, max-age=0"));
  assert.throws(() => assertRequestCachePolicy("private, s-maxage=60"));
});
