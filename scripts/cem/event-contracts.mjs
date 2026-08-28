import assert from "node:assert/strict";
import { ts } from "../../packages/components/node_modules/@custom-elements-manifest/analyzer/index.js";

/** Resolve only explicit, public event contracts; never infer detail from prose. */
export function createEventContractValidator(packageName, models, reference) {
  const types = new Map();
  const published = new Map();
  const key = (module, name) => `${module}#${name}`;
  for (const [module, model] of models) {
    for (const node of model.source.statements) {
      if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))
        types.set(key(module, node.name.text), node);
    }
  }
  const index = models.get("src/index.ts");
  for (const node of index?.source.statements ?? []) {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const item of node.exportClause.elements) {
        const name = item.propertyName?.text ?? item.name.text;
        const target = node.moduleSpecifier
          ? reference("src/index.ts", node.moduleSpecifier.text, name)
          : (index.imports.get(name) ?? { module: "src/index.ts", name });
        if (target.module) published.set(item.name.text, key(target.module, target.name));
      }
    } else if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      published.set(node.name.text, key("src/index.ts", node.name.text));
    }
  }
  const resolve = (module, name) => models.get(module)?.imports.get(name) ?? { module, name };
  const requirePublicType = (module, name, visited = new Set()) => {
    const target = resolve(module, name);
    assert.ok(target.module && !target.package, `Unsupported external event contract: ${name}`);
    const identity = key(target.module, target.name);
    const node = types.get(identity);
    assert.ok(node, `Unresolved event type: ${identity}`);
    assert.equal(
      published.get(target.name),
      identity,
      `Event type is not exported from the public barrel: ${target.name}`
    );
    assert.ok(
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      `Event type declaration is not exported: ${identity}`
    );
    if (visited.has(identity)) return node;
    const seen = new Set([...visited, identity]);
    const walk = (child) => {
      assert.notEqual(
        child.kind,
        ts.SyntaxKind.AnyKeyword,
        `Event contract must not hide any: ${identity}`
      );
      if (ts.isTypeReferenceNode(child)) {
        assert.ok(ts.isIdentifier(child.typeName), `Unsupported qualified event type: ${identity}`);
        const dependency = child.typeName.text;
        if (!["CustomEvent", "Array", "ReadonlyArray", "File", "HTMLElement"].includes(dependency))
          requirePublicType(target.module, dependency, seen);
      }
      ts.forEachChild(child, walk);
    };
    walk(node);
    return node;
  };

  return (module, owner, events, constructors) => {
    for (const event of events) {
      const name = event.type?.text;
      if (["CustomEvent<unknown>", "Event"].includes(name)) continue;
      assert.match(
        name,
        /^[A-Za-z_$][\w$]*$/,
        `Typed event needs a named public contract: ${owner.name.text}/${event.name}`
      );
      const alias = requirePublicType(module, name);
      assert.ok(
        ts.isTypeAliasDeclaration(alias) &&
          ts.isTypeReferenceNode(alias.type) &&
          ts.isIdentifier(alias.type.typeName) &&
          alias.type.typeName.text === "CustomEvent" &&
          alias.type.typeArguments?.length === 1,
        `Event contract must explicitly alias CustomEvent<Detail>: ${name}`
      );
      const detail = alias.type.typeArguments[0].getText();
      assert.ok(
        !["any", "unknown"].includes(detail),
        `A named event contract must not conceal an unverified payload: ${name}`
      );
      const dispatches = constructors.filter((node) => node.arguments[0].text === event.name);
      assert.ok(
        dispatches.length > 0,
        `Typed event has no proven literal dispatch: ${owner.name.text}/${event.name}`
      );
      for (const dispatch of dispatches) {
        assert.equal(dispatch.expression.getText(), "CustomEvent");
        assert.equal(
          dispatch.typeArguments?.length,
          1,
          `Typed event dispatch lacks an explicit detail generic: ${owner.name.text}/${event.name}`
        );
        assert.equal(
          dispatch.typeArguments[0].getText(),
          detail,
          `Event annotation and dispatch detail generic disagree: ${owner.name.text}/${event.name}`
        );
        // CustomEventInit<T>.detail is optional in lib.dom: a generic alone can
        // promise an object while the browser supplies null.
        const options = dispatch.arguments[1];
        assert.ok(
          options && ts.isObjectLiteralExpression(options),
          `Typed event needs explicit detail initialization: ${event.name}`
        );
        const detailProperties = options.properties.filter(
          (property) => property.name?.getText() === "detail"
        );
        assert.equal(
          detailProperties.length,
          1,
          `Typed event needs exactly one explicit detail field: ${event.name}`
        );
        const field = detailProperties[0];
        assert.ok(
          ts.isPropertyAssignment(field),
          `Typed event detail needs an explicit initializer: ${event.name}`
        );
        assert.ok(
          detail === "null"
            ? field.initializer.kind === ts.SyntaxKind.NullKeyword
            : ts.isObjectLiteralExpression(field.initializer),
          `Typed event detail must be a checked object literal or explicit null: ${event.name}`
        );
      }
      event.type = { text: name, references: [{ name, package: packageName }] };
      event["x-fluid-event-contract"] = {
        detailType: detail,
        dispatches: dispatches.length,
        verification: "explicit-dispatch-generic"
      };
    }
    return events;
  };
}
