import assert from "node:assert/strict";
import { test } from "node:test";
import { prefixDocLinks } from "../apps/docs/src/lib/prefix-doc-links.mjs";

function links(...hrefs) {
  return {
    type: "root",
    children: hrefs.map((href) => ({ type: "element", properties: { href } }))
  };
}

test("prefixes authored documentation links for a mounted build", () => {
  const tree = links("/components/button/", "/guides/forms/#submit", "/docs/theming/basics/");
  tree.children.push(
    { type: "link", url: "/components/card/", children: [] },
    {
      type: "mdxJsxFlowElement",
      attributes: [{ type: "mdxJsxAttribute", name: "href", value: "/components/tabs/" }],
      children: []
    }
  );
  prefixDocLinks({ base: "/docs/" })(tree);
  assert.deepEqual(
    tree.children.slice(0, 3).map((node) => node.properties.href),
    ["/docs/components/button/", "/docs/guides/forms/#submit", "/docs/theming/basics/"]
  );
  assert.equal(tree.children[3].url, "/docs/components/card/");
  assert.equal(tree.children[4].attributes[0].value, "/docs/components/tabs/");
});

test("leaves landing, separately built surfaces and non-root URLs untouched", () => {
  const tree = links(
    "/",
    "/storybook/",
    "/playground/",
    "/wizard/",
    "/demos/react/",
    "https://example.test/",
    "#local",
    "../relative/"
  );
  prefixDocLinks({ base: "/docs/" })(tree);
  assert.deepEqual(
    tree.children.map((node) => node.properties.href),
    [
      "/",
      "/storybook/",
      "/playground/",
      "/wizard/",
      "/demos/react/",
      "https://example.test/",
      "#local",
      "../relative/"
    ]
  );
});

test("does nothing for root-mounted documentation and rejects malformed bases", () => {
  const tree = links("/components/button/");
  prefixDocLinks({ base: "/" })(tree);
  assert.equal(tree.children[0].properties.href, "/components/button/");
  assert.throws(() => prefixDocLinks({ base: "docs" }), /start and end with/);
});
