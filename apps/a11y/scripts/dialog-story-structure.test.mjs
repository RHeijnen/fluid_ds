import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const storyUrl = new URL(
  "../../../packages/components/src/components/dialog/fluid-dialog.stories.ts",
  import.meta.url
);
const sourceText = await readFile(storyUrl, "utf8");
const source = ts.createSourceFile(storyUrl.pathname, sourceText, ts.ScriptTarget.Latest, true);

function storyTemplate(name) {
  let template;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === name &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      const render = node.initializer.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) && property.name.getText(source) === "render"
      );
      const body = render && ts.isPropertyAssignment(render) ? render.initializer.body : undefined;
      if (body && ts.isTaggedTemplateExpression(body)) template = body.template.getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(template, `could not find the ${name} story render template`);
  return template;
}

test("Default keeps its opener and dialog in the same data-story lookup scope", () => {
  assert.match(
    storyTemplate("Default"),
    /^`\s*<div data-story>[\s\S]*?<fluid-button[\s\S]*?Open dialog[\s\S]*?<fluid-dialog>/
  );
});

test("Sizes keeps its openers and dialogs in the same data-story lookup scope", () => {
  assert.match(
    storyTemplate("Sizes"),
    /^`\s*<div data-story>[\s\S]*?<fluid-button[\s\S]*?<fluid-dialog/
  );
});
