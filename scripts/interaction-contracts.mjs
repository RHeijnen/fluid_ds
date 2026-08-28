import ts from "typescript";

function property(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find(
    (node) => ts.isPropertyAssignment(node) && node.name.getText().replace(/["']/g, "") === name
  )?.initializer;
}

function hasContractTag(object, value = "interaction-contract") {
  const tags = property(object, "tags");
  return (
    tags &&
    ts.isArrayLiteralExpression(tags) &&
    tags.elements.some((tag) => ts.isStringLiteral(tag) && tag.text === value)
  );
}

// Source attribution only. Browser execution remains the actual release gate.
// Parse each exported story separately so comments or a neighboring story's
// play function cannot make a non-interactive story look covered.
export function interactionContractTagsFromSource(source) {
  const file = ts.createSourceFile("contracts.ts", source, ts.ScriptTarget.Latest, true);
  const objects = new Map();
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name))
        objects.set(declaration.name.text, declaration.initializer);
    }
  }
  const defaultExport = file.statements.find(
    (node) => ts.isExportAssignment(node) && !node.isExportEquals
  );
  const meta =
    defaultExport &&
    (ts.isIdentifier(defaultExport.expression)
      ? objects.get(defaultExport.expression.text)
      : defaultExport.expression);
  const inheritedTag = hasContractTag(meta);
  const tags = new Set();
  for (const statement of file.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const declaration of statement.declarationList.declarations) {
      const story = declaration.initializer;
      const play = property(story, "play");
      const tag = property(property(property(story, "parameters"), "quality"), "componentTag");
      if (
        (inheritedTag || hasContractTag(story)) &&
        !hasContractTag(story, "!interaction-contract") &&
        play &&
        (ts.isArrowFunction(play) || ts.isFunctionExpression(play)) &&
        tag &&
        ts.isStringLiteral(tag) &&
        /^fluid-[a-z0-9-]+$/.test(tag.text)
      )
        tags.add(tag.text);
    }
  }
  return tags;
}
