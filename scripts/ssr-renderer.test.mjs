import assert from "node:assert/strict";
import test from "node:test";
import { html, nothing } from "lit";
import { renderThunked } from "@lit-labs/ssr";
import { ElementRenderer } from "@lit-labs/ssr/lib/element-renderer.js";
import { renderFluid, renderFluidToString } from "../packages/components/dist/ssr.js";
import "../packages/components/dist/components/pagination/define.js";
import nl from "../packages/components/dist/locales/nl.js";
import de from "../packages/components/dist/locales/de.js";

const probeTag = "fluid-ssr-renderer-probe";
globalThis.customElements.define(probeTag, class {});
const template = html`<fluid-ssr-renderer-probe></fluid-ssr-renderer-probe>`;

function probeRenderer(renderShadow) {
  return class extends ElementRenderer {
    static matchesClass(_class, tag) {
      return tag === probeTag;
    }
    renderShadow(info) {
      return renderShadow(info);
    }
    get shadowRootOptions() {
      return { mode: "open", delegatesFocus: true };
    }
  };
}

test("renders escaped values, nested templates, iterables and empty values", async () => {
  const output = await renderFluidToString(
    html`<main title=${'"<&'}>
      ${"<script>"}${[html`<b>${"A&B"}</b>`, nothing, null, undefined]}
    </main>`
  );
  assert.match(output, /title="&quot;&lt;&amp;"/);
  assert.match(output, /&lt;script&gt;/);
  assert.match(output, /A&amp;B/);
  assert.doesNotMatch(output, /<script>|undefined|null/);
});

test("exposes a lazy ordered iterable, not a prematurely collected string", async () => {
  const visited = [];
  const Renderer = probeRenderer(() => [
    () => {
      visited.push("first");
      return "first";
    },
    () => {
      visited.push("second");
      return "second";
    }
  ]);
  const result = renderFluid(template, { elementRenderers: [Renderer] });
  assert.equal(typeof result[Symbol.iterator], "function");
  assert.deepEqual(visited, []);
  const chunks = [];
  for (const chunk of result) {
    assert.equal(typeof chunk, "string");
    chunks.push(chunk);
  }
  assert.ok(chunks.length > 2);
  assert.deepEqual(visited, ["first", "second"]);
  assert.match(chunks.join(""), /firstsecond/);
  assert.match(chunks.join(""), /shadowrootdelegatesfocus/);
});

test("awaits nested asynchronous chunks before advancing the renderer", async () => {
  const visited = [];
  const Renderer = probeRenderer(() => [
    "before",
    async () => {
      await Promise.resolve();
      visited.push("outer");
      return [
        "middle",
        async () => {
          await Promise.resolve();
          visited.push("inner");
          return ["nested"];
        }
      ];
    },
    () => {
      assert.deepEqual(visited, ["outer", "inner"]);
      visited.push("after");
      return "after";
    }
  ]);
  const output = await renderFluidToString(template, { elementRenderers: [Renderer] });
  assert.match(output, /beforemiddlenestedafter/);
  assert.deepEqual(visited, ["outer", "inner", "after"]);
});

test("observes a promise that resolves directly to a string chunk", async () => {
  const Renderer = probeRenderer(() => [async () => "async-string"]);
  const output = await renderFluidToString(template, { elementRenderers: [Renderer] });
  assert.match(output, /async-string/);
});

test("propagates asynchronous rendering errors instead of returning partial HTML", async () => {
  const failure = new Error("intentional async rendering failure");
  let advanced = false;
  const Renderer = probeRenderer(() => [
    "partial",
    async () => {
      throw failure;
    },
    () => {
      advanced = true;
      return "unreachable";
    }
  ]);
  await assert.rejects(renderFluidToString(template, { elementRenderers: [Renderer] }), {
    message: failure.message
  });
  assert.equal(advanced, false);
});

test("propagates synchronous renderer errors", async () => {
  const Renderer = probeRenderer(() => {
    throw new Error("intentional synchronous rendering failure");
  });
  await assert.rejects(
    renderFluidToString(template, { elementRenderers: [Renderer] }),
    /intentional synchronous rendering failure/
  );
});

test("keeps simultaneous caller render contexts separate", async () => {
  const RendererA = probeRenderer(() => [async () => ["request-A"]]);
  const RendererB = probeRenderer(() => [async () => ["request-B"]]);
  const [a, b] = await Promise.all([
    renderFluidToString(template, { elementRenderers: [RendererA] }),
    renderFluidToString(template, { elementRenderers: [RendererB] })
  ]);
  assert.match(a, /request-A/);
  assert.doesNotMatch(a, /request-B/);
  assert.match(b, /request-B/);
  assert.doesNotMatch(b, /request-A/);
});

test("inherits localization from the HTML parser's actual native ancestry", async () => {
  const nested = await renderFluidToString(
    html`<main lang="en">
      <section lang="nl"><fluid-pagination total="3"></fluid-pagination></section>
    </main>`
  );
  assert.match(nested, new RegExp(`aria-label="${nl.previousPage}"`));

  const TemplateRenderer = probeRenderer((info) => [
    '<template lang="nl" dir="rtl">',
    () => renderThunked(html`<fluid-pagination total="3"></fluid-pagination>`, info),
    "</template>"
  ]);
  const templateAncestry = await renderFluidToString(template, {
    elementRenderers: [TemplateRenderer]
  });
  assert.match(templateAncestry, new RegExp(`aria-label="${nl.previousPage}"`));

  const optionalListEnd = await renderFluidToString(
    html`<main lang="en">
      <ul>
        <li lang="nl">one</li>
        <li><fluid-pagination total="3"></fluid-pagination></li>
      </ul>
    </main>`
  );
  const optionalParagraphEnd = await renderFluidToString(
    html`<main lang="en">
      <p lang="nl">intro</p>
      <div><fluid-pagination total="3"></fluid-pagination></div>
    </main>`
  );
  const fosterParented = await renderFluidToString(
    html`<main lang="en">
      <table lang="nl">
        <fluid-pagination total="3"></fluid-pagination>
        <tr>
          <td>x</td>
        </tr>
      </table>
    </main>`
  );
  for (const output of [optionalListEnd, optionalParagraphEnd, fosterParented]) {
    assert.match(output, /aria-label="Previous page"/);
    assert.doesNotMatch(output, new RegExp(`aria-label="${nl.previousPage}"`));
  }
});

test("keeps parser-derived locale context isolated across interleaved async requests", async () => {
  const shellTag = "fluid-ssr-locale-shell";
  if (!globalThis.customElements.get(shellTag)) {
    globalThis.customElements.define(shellTag, class {});
  }
  let arrivals = 0;
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const renderer = (locale) =>
    class extends ElementRenderer {
      static matchesClass(_ctor, tagName) {
        return tagName === shellTag;
      }
      renderShadow(info) {
        return [
          async () => {
            arrivals++;
            if (arrivals === 2) release();
            await barrier;
            return [
              () =>
                renderThunked(
                  html`<section lang=${locale}>
                    <fluid-pagination total="3"></fluid-pagination>
                  </section>`,
                  info
                )
            ];
          }
        ];
      }
    };
  const [left, right] = await Promise.all([
    renderFluidToString(html`<fluid-ssr-locale-shell></fluid-ssr-locale-shell>`, {
      elementRenderers: [renderer("nl")]
    }),
    renderFluidToString(html`<fluid-ssr-locale-shell></fluid-ssr-locale-shell>`, {
      elementRenderers: [renderer("de")]
    })
  ]);
  assert.match(left, new RegExp(`aria-label="${nl.previousPage}"`));
  assert.doesNotMatch(left, new RegExp(`aria-label="${de.previousPage}"`));
  assert.match(right, new RegExp(`aria-label="${de.previousPage}"`));
  assert.doesNotMatch(right, new RegExp(`aria-label="${nl.previousPage}"`));
});
