import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { posix, join } from "node:path";
import {
  create,
  ts
} from "../../packages/components/node_modules/@custom-elements-manifest/analyzer/index.js";
import { litPlugin } from "../../packages/components/node_modules/@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";
import { usesTokenPlugin } from "../../packages/components/cem-plugins/uses-token.mjs";
import { createEventContractValidator } from "./event-contracts.mjs";

// Use the analyzer owner's declared, locked dependency, not an undeclared hoist.
// No manifest or package.json is written by this module.
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const clone = (value) => JSON.parse(JSON.stringify(value));
const classKey = (module, name) => `${canonicalModule(module)}#${name}`;

export function canonicalModule(value) {
  assert.equal(typeof value, "string", "A module reference must be a string");
  const path = value.replaceAll("\\", "/").replace(/^\/src\//, "src/");
  assert.ok(
    /^src\//.test(path) && !path.split("/").some((part) => ["..", ".", ""].includes(part)),
    `Invalid package-local module: ${value}`
  );
  return path.replace(/\.js$/, ".ts");
}

function importReference(module, specifier, name) {
  if (!specifier.startsWith(".")) return { package: specifier, name };
  const path = posix.normalize(posix.join(posix.dirname(module), specifier));
  return { module: canonicalModule(/\.[cm]?[jt]s$/.test(path) ? path : `${path}.ts`), name };
}

function sourceModel(modules) {
  const models = new Map();
  for (const source of modules) {
    const module = canonicalModule(source.fileName);
    const imports = new Map();
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const binding of bindings.elements)
            imports.set(
              binding.name.text,
              importReference(
                module,
                statement.moduleSpecifier.text,
                binding.propertyName?.text ?? binding.name.text
              )
            );
        }
      }
    }
    models.set(module, {
      source,
      imports,
      classes: new Map(),
      factories: new Map(),
      variables: new Map()
    });
  }
  const classNames = new Map();
  for (const [module, model] of models) {
    const reference = (name) => model.imports.get(name) ?? { module, name };
    for (const statement of model.source.statements) {
      if (ts.isClassDeclaration(statement) && statement.name) {
        const name = statement.name.text;
        assert.ok(
          !classNames.has(name),
          `Ambiguous analyzer class name ${name}: ${classNames.get(name)} and ${module}`
        );
        classNames.set(name, module);
        const extendsClause = statement.heritageClauses?.find(
          (entry) => entry.token === ts.SyntaxKind.ExtendsKeyword
        )?.types[0]?.expression;
        model.classes.set(name, {
          node: statement,
          base:
            extendsClause && ts.isIdentifier(extendsClause) ? reference(extendsClause.text) : null
        });
      }
      if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
        // This adapter deliberately supports only the constructor-only factory
        // shape used by typed charts. Conditional returns need a separate adapter.
        const returns =
          statement.body.statements.length === 1
            ? statement.body.statements.filter(ts.isReturnStatement)
            : [];
        if (
          returns.length === 1 &&
          returns[0].expression &&
          ts.isClassExpression(returns[0].expression)
        ) {
          const returned = returns[0].expression;
          const base = returned.heritageClauses?.find(
            (entry) => entry.token === ts.SyntaxKind.ExtendsKeyword
          )?.types[0]?.expression;
          if (base && ts.isIdentifier(base))
            model.factories.set(statement.name.text, {
              base: reference(base.text),
              constructorOnly: returned.members.every(ts.isConstructorDeclaration)
            });
        }
      }
      if (ts.isVariableStatement(statement)) {
        for (const variable of statement.declarationList.declarations) {
          if (ts.isIdentifier(variable.name)) model.variables.set(variable.name.text, variable);
        }
      }
    }
  }
  const aliases = new Map();
  for (const [module, model] of models) {
    for (const [name, variable] of model.variables) {
      const call = variable.initializer;
      if (!call || !ts.isCallExpression(call) || !ts.isIdentifier(call.expression)) continue;
      const factoryRef = model.imports.get(call.expression.text) ?? {
        module,
        name: call.expression.text
      };
      const factory =
        factoryRef.module && models.get(factoryRef.module)?.factories.get(factoryRef.name);
      if (!factory) continue;
      assert.ok(
        factory.constructorOnly,
        `Unsupported factory ${factoryRef.name}: subclass members require an explicit analyzer adapter`
      );
      assert.ok(
        factory.base.module && models.get(factory.base.module)?.classes.has(factory.base.name),
        `Unresolved factory base for ${name}`
      );
      aliases.set(classKey(module, name), { ...factory, name, module });
    }
  }
  // Protect the upstream name-based inheritance traversal from malformed cycles.
  const bases = new Map();
  for (const [module, model] of models) {
    for (const [name, record] of model.classes) bases.set(classKey(module, name), record.base);
  }
  for (const [key, alias] of aliases) bases.set(key, alias.base);
  const visit = (key, stack = new Set()) => {
    assert.ok(!stack.has(key), `Cyclic inheritance: ${[...stack, key].join(" -> ")}`);
    const base = bases.get(key);
    if (!base?.module) return;
    const next = classKey(base.module, base.name);
    if (bases.has(next)) visit(next, new Set([...stack, key]));
  };
  for (const key of bases.keys()) visit(key);
  return { models, aliases };
}

function eventTags(node) {
  const result = new Map();
  for (const tag of ts.getJSDocTags(node)) {
    if (!["fires", "event"].includes(tag.tagName.text)) continue;
    let text = tag
      .getText()
      .replace(/^@(fires|event)\s*/, "")
      .trim();
    let type;
    if (text.startsWith("{")) {
      let depth = 0;
      let end = -1;
      for (let index = 0; index < text.length; index++) {
        if (text[index] === "{") depth++;
        if (text[index] === "}" && --depth === 0) {
          end = index;
          break;
        }
      }
      assert.ok(end > 1, `Malformed event type annotation: ${text}`);
      type = text.slice(1, end);
      text = text.slice(end + 1).trim();
    }
    const match = /^([a-z][a-z0-9-]*)(?:\s+-?\s*([\s\S]*))?$/.exec(text);
    assert.ok(match, `Malformed public event annotation: ${text}`);
    assert.ok(!result.has(match[1]), `Duplicate event annotation: ${match[1]}`);
    result.set(match[1], {
      name: match[1],
      ...(type ? { type: { text: type } } : {}),
      ...(match[2] ? { description: match[2].trim() } : {})
    });
  }
  return result;
}

function ignoredEvent(node, owner) {
  for (let current = node; current && current !== owner; current = current.parent) {
    if (ts.getJSDocTags(current).some((tag) => ["internal", "ignore"].includes(tag.tagName.text)))
      return true;
    // TypeScript does not attach JSDoc tags to an inline expression statement.
    // Inspect only its leading trivia, never event strings or method bodies.
    const trivia = current.getSourceFile().text.slice(current.getFullStart(), current.getStart());
    for (const comment of trivia.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
      if (/(?:^|[\s*])@(internal|ignore)(?=[\s*]|$)/.test(comment[0])) return true;
    }
  }
  return false;
}

function sourceEvents(node) {
  const events = eventTags(node);
  const constructors = [];
  const direct = new Set();
  const variables = new Set();
  const scope = (current) => {
    for (let parent = current.parent; parent && parent !== node; parent = parent.parent) {
      if (ts.isBlock(parent) || ts.isFunctionLike(parent)) return parent.pos;
    }
    return node.pos;
  };
  const collectDispatch = (current) => {
    if (current !== node && (ts.isClassDeclaration(current) || ts.isClassExpression(current)))
      return;
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      current.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
      current.expression.name.text === "dispatchEvent" &&
      !ignoredEvent(current, node)
    ) {
      const event = current.arguments[0];
      if (event && ts.isNewExpression(event)) direct.add(event);
      else if (event && ts.isIdentifier(event)) variables.add(`${scope(current)}:${event.text}`);
    }
    ts.forEachChild(current, collectDispatch);
  };
  collectDispatch(node);
  const walk = (current) => {
    if (current !== node && (ts.isClassDeclaration(current) || ts.isClassExpression(current)))
      return;
    // Only immutable locals dispatched from the same lexical block are proven
    // here. More complex aliases/control flow need an explicit @fires contract.
    const assignedAndDispatched =
      ts.isVariableDeclaration(current.parent) &&
      ts.isIdentifier(current.parent.name) &&
      (current.parent.parent.flags & ts.NodeFlags.Const) !== 0 &&
      variables.has(`${scope(current)}:${current.parent.name.text}`);
    if (
      (direct.has(current) || assignedAndDispatched) &&
      ts.isNewExpression(current) &&
      ts.isIdentifier(current.expression) &&
      ["CustomEvent", "Event"].includes(current.expression.text) &&
      ts.isStringLiteral(current.arguments?.[0]) &&
      !ignoredEvent(current, node)
    ) {
      const name = current.arguments[0].text;
      constructors.push(current);
      if (!events.has(name))
        events.set(name, {
          name,
          type: { text: current.expression.text === "Event" ? "Event" : "CustomEvent<unknown>" }
        });
    }
    ts.forEachChild(current, walk);
  };
  walk(node);
  for (const event of events.values()) {
    if (!event.type || event.type.text === "CustomEvent")
      event.type = { text: "CustomEvent<unknown>" };
  }
  return { events: [...events.values()].sort((a, b) => compare(a.name, b.name)), constructors };
}

function canonicalPlugin(model, packageName) {
  const own = new Map();
  const validateEventContracts = createEventContractValidator(
    packageName,
    model.models,
    importReference
  );
  const inheritanceKinds = [
    "members",
    "attributes",
    "events",
    "slots",
    "cssParts",
    "cssProperties",
    "cssStates"
  ];
  return {
    name: "fluid-canonical-contracts",
    analyzePhase({ node, moduleDoc }) {
      if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;
      const alias = model.aliases.get(classKey(moduleDoc.path, node.name.text));
      if (!alias) return;
      const previous = moduleDoc.declarations.find((entry) => entry.name === alias.name);
      const declaration = {
        kind: "class",
        name: alias.name,
        description: previous?.description ?? "",
        superclass: alias.base
      };
      moduleDoc.declarations = moduleDoc.declarations.filter((entry) => entry.name !== alias.name);
      moduleDoc.declarations.push(declaration);
    },
    moduleLinkPhase({ moduleDoc }) {
      const module = canonicalModule(moduleDoc.path);
      for (const declaration of moduleDoc.declarations ?? []) {
        if (declaration.kind !== "class") continue;
        const source = model.models.get(module)?.classes.get(declaration.name);
        if (source) {
          const { events, constructors } = sourceEvents(source.node);
          declaration.events = validateEventContracts(module, source.node, events, constructors);
        } else declaration.events = [];
        const fields = {};
        for (const kind of inheritanceKinds) fields[kind] = clone(declaration[kind] ?? []);
        own.set(classKey(module, declaration.name), fields);
      }
    },
    packageLinkPhase({ customElementsManifest }) {
      const declarations = new Map();
      for (const module of customElementsManifest.modules) {
        for (const declaration of module.declarations ?? []) {
          if (declaration.kind === "class")
            declarations.set(classKey(module.path, declaration.name), declaration);
        }
      }
      const complete = new Set();
      const resolve = (key, visiting = new Set()) => {
        if (complete.has(key)) return;
        assert.ok(!visiting.has(key), `Cyclic canonical inheritance: ${key}`);
        const declaration = declarations.get(key);
        const base = declaration.superclass;
        const baseKey = base?.module && !base.package ? classKey(base.module, base.name) : null;
        if (baseKey && declarations.has(baseKey)) resolve(baseKey, new Set([...visiting, key]));
        for (const kind of inheritanceKinds) {
          const inherited = (baseKey && declarations.get(baseKey)?.[kind]) || [];
          const itemKey = (entry) =>
            kind === "members"
              ? `${entry.static ? "static" : "instance"}:${entry.name}`
              : entry.name;
          const values = new Map(
            inherited.map((entry) => [
              itemKey(entry),
              {
                ...clone(entry),
                inheritedFrom: { name: base.name, module: canonicalModule(base.module) }
              }
            ])
          );
          for (const entry of own.get(key)?.[kind] ?? []) values.set(itemKey(entry), clone(entry));
          if (values.size) declaration[kind] = [...values.values()];
          else delete declaration[kind];
        }
        complete.add(key);
      };
      for (const key of declarations.keys()) resolve(key);
    }
  };
}

function normalizeManifest(manifest) {
  const normalizeReferences = (value, owner) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.module === "string" && !value.package) {
      if (value.module.startsWith("."))
        value.module = importReference(owner, value.module, value.name).module;
      else if (/^\/?src\//.test(value.module)) value.module = canonicalModule(value.module);
      else
        assert.match(
          value.module,
          /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+(?:\/[a-z0-9_.-]+)*$/,
          `Invalid external module reference: ${value.module}`
        );
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach((entry) => normalizeReferences(entry, owner));
      else if (child && typeof child === "object") normalizeReferences(child, owner);
    }
  };
  for (const module of manifest.modules) {
    module.path = canonicalModule(module.path);
    normalizeReferences(module, module.path);
    module.declarations?.sort((a, b) => compare(a.name, b.name));
    module.exports?.sort((a, b) => compare(`${a.kind}:${a.name}`, `${b.kind}:${b.name}`));
  }
  manifest.modules.sort((a, b) => compare(a.path, b.path));
  return manifest;
}

export function analyzePackage(packageName, sources) {
  assert.match(packageName, /^@fluid-ds\/[a-z][a-z0-9-]*$/);
  const modules = [...sources]
    .sort((a, b) => compare(a.path, b.path))
    .map(({ path, text }) =>
      ts.createSourceFile(canonicalModule(path), text, ts.ScriptTarget.Latest, true)
    );
  assert.equal(
    new Set(modules.map((module) => module.fileName)).size,
    modules.length,
    `Duplicate source module in ${packageName}`
  );
  const model = sourceModel(modules);
  const manifest = create({
    modules,
    plugins: [...litPlugin(), usesTokenPlugin(), canonicalPlugin(model, packageName)]
  });
  return normalizeManifest(manifest);
}

export function resolveRegistry(records, expectedInventory) {
  const registry = [];
  const tags = new Set();
  const packages = new Set();
  for (const { packageName, manifest } of records) {
    assert.match(packageName, /^@fluid-ds\/[a-z][a-z0-9-]*$/);
    assert.ok(!packages.has(packageName), `Duplicate manifest package: ${packageName}`);
    packages.add(packageName);
    assert.equal(manifest.schemaVersion, "1.0.0", `Unsupported CEM schema for ${packageName}`);
    const declarations = new Map();
    const modules = new Map();
    for (const module of manifest.modules) {
      const path = canonicalModule(module.path);
      assert.ok(!modules.has(path), `Duplicate manifest module: ${packageName}/${path}`);
      modules.set(path, module);
      for (const declaration of module.declarations ?? []) {
        const key = classKey(path, declaration.name);
        assert.ok(!declarations.has(key), `Duplicate declaration: ${packageName}/${key}`);
        declarations.set(key, declaration);
      }
    }
    for (const module of manifest.modules) {
      for (const definition of module.exports ?? []) {
        if (definition.kind !== "custom-element-definition") continue;
        assert.match(definition.name, /^fluid-[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.ok(!tags.has(definition.name), `Duplicate registered tag: ${definition.name}`);
        tags.add(definition.name);
        const reference = definition.declaration;
        assert.ok(
          reference?.module && !reference.package,
          `Missing local definition reference: ${definition.name}`
        );
        const key = classKey(reference.module, reference.name);
        const declaration = declarations.get(key);
        assert.equal(
          declaration?.kind,
          "class",
          `Unresolved class or unsupported factory: ${definition.name} -> ${key}`
        );
        const published = modules
          .get("src/index.ts")
          ?.exports?.some(
            (entry) =>
              entry.kind === "js" &&
              entry.name === reference.name &&
              entry.declaration?.module &&
              classKey(entry.declaration.module, entry.declaration.name) === key
          );
        assert.ok(published, `Class is not publicly exported: ${packageName}/${reference.name}`);
        const events = declaration.events ?? [];
        assert.equal(
          new Set(events.map((event) => event.name)).size,
          events.length,
          `Duplicate events: ${definition.name}`
        );
        for (const event of events)
          assert.match(
            event.name,
            /^fluid-[a-z0-9]+(?:-[a-z0-9]+)*$/,
            `Invalid public event: ${definition.name}/${event.name}`
          );
        registry.push({
          tag: definition.name,
          package: packageName,
          className: reference.name,
          module: canonicalModule(reference.module),
          events: clone(events)
        });
      }
    }
  }
  registry.sort((a, b) => compare(a.tag, b.tag));
  if (expectedInventory) {
    const actual = registry.map(({ tag, package: name }) => `${name}/${tag}`).sort(compare);
    const expected = expectedInventory
      .map(({ tag, package: name }) => `${name}/${tag}`)
      .sort(compare);
    assert.deepEqual(
      actual,
      expected,
      "Canonical CEM registration inventory differs from the independent quality catalog"
    );
  }
  return registry;
}

export function requireManifestPublication(packageName, descriptor) {
  assert.equal(descriptor.name, packageName);
  assert.equal(
    descriptor.customElements,
    "custom-elements.json",
    `Missing customElements metadata: ${packageName}`
  );
  assert.equal(
    descriptor.exports?.["./custom-elements.json"],
    "./custom-elements.json",
    `Missing workspace CEM export: ${packageName}`
  );
  assert.equal(
    descriptor.publishConfig?.exports?.["./custom-elements.json"],
    "./custom-elements.json",
    `Missing published CEM export: ${packageName}`
  );
  assert.ok(
    descriptor.files?.includes("custom-elements.json"),
    `Manifest is absent from published files: ${packageName}`
  );
}

export async function readRepositoryManifests(root) {
  const inventory = JSON.parse(
    await readFile(join(root, "quality/component-quality.json"), "utf8")
  ).components;
  const records = [];
  for (const packageName of [...new Set(inventory.map((entry) => entry.package))].sort(compare)) {
    assert.match(packageName, /^@fluid-ds\/[a-z][a-z0-9-]*$/);
    const packageRoot = join(root, "packages", packageName.split("/")[1]);
    const descriptor = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    requireManifestPublication(packageName, descriptor);
    const sources = [];
    const walk = async (path) => {
      for (const entry of await readdir(join(packageRoot, path), { withFileTypes: true })) {
        const next = `${path}/${entry.name}`;
        if (entry.isDirectory()) await walk(next);
        else if (entry.isFile() && next.endsWith(".ts") && !/\.(?:test|stories|d)\.ts$/.test(next))
          sources.push({ path: next, text: await readFile(join(packageRoot, next), "utf8") });
      }
    };
    await walk("src");
    records.push({ packageName, manifest: analyzePackage(packageName, sources) });
  }
  return { records, registry: resolveRegistry(records, inventory) };
}

export function expectedManifestOutputs(records) {
  return new Map(
    [...records]
      .sort((a, b) => compare(a.packageName, b.packageName))
      .map(({ packageName, manifest }) => {
        assert.match(packageName, /^@fluid-ds\/[a-z][a-z0-9-]*$/);
        return [
          `packages/${packageName.split("/")[1]}/custom-elements.json`,
          `${JSON.stringify(manifest, null, 2)}\n`
        ];
      })
  );
}

export async function checkManifestOutputs(root, outputs) {
  const problems = [];
  for (const [path, expected] of outputs) {
    try {
      if ((await readFile(join(root, path), "utf8")) !== expected)
        problems.push(`Changed manifest: ${path}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      problems.push(`Missing manifest: ${path}`);
    }
  }
  assert.equal(problems.length, 0, problems.join("\n"));
}
