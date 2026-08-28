import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const commandModule = "@web/test-runner-commands";
export const asyncBrowserCommands = Object.freeze([
  "executeServerCommand",
  "setViewport",
  "emulateMedia",
  "setUserAgent",
  "sendKeys",
  "selectOption",
  "sendMouse",
  "resetMouse",
  "a11ySnapshot",
  "writeFile",
  "readFile",
  "removeFile",
  "getSnapshotConfig",
  "getSnapshots",
  "getSnapshot",
  "saveSnapshot",
  "removeSnapshot",
  "compareSnapshot"
]);
const commandNames = new Set(asyncBrowserCommands);
const clipboardNames = new Set(["read", "readText", "write", "writeText"]);
const testHooks = new Set(["it", "test", "before", "after", "beforeEach", "afterEach"]);
const isFunction = (node) =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node);
const unwrap = (node) => {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node))
  )
    node = node.expression;
  return node;
};
const property = (node) => {
  if (ts.isPropertyAccessExpression(node))
    return { receiver: node.expression, name: node.name.text };
  if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression))
    return { receiver: node.expression, name: node.argumentExpression.text };
  return null;
};

/**
 * A deliberately bounded ownership proof, not a general promise linter.
 * Commands must flow through await/return or an awaited/returned Promise.all,
 * and every enclosing local helper must be owned by a Mocha test/hook.
 * Timers, unknown callbacks, promise races and escaping references fail closed.
 * The checker binds local symbols only; it does not load or execute imports.
 */
export function inspectBrowserCommandOwnership(text, filename = "fixture.test.ts") {
  const file = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (file.parseDiagnostics.length) throw new Error(`Cannot parse browser test: ${filename}`);
  const options = { noResolve: true, noLib: true, target: ts.ScriptTarget.Latest };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === filename ? file : undefined);
  host.fileExists = (name) => name === filename;
  host.readFile = (name) => (name === filename ? text : undefined);
  const checker = ts.createProgram([filename], options, host).getTypeChecker();
  const nodes = [];
  const walk = (node) => {
    nodes.push(node);
    ts.forEachChild(node, walk);
  };
  walk(file);
  const symbol = (node) => checker.getSymbolAtLocation(node);
  const declaration = (node) => symbol(node)?.declarations?.[0];
  const initializer = (node) => {
    const item = ts.isIdentifier(node) && declaration(node);
    return item && ts.isVariableDeclaration(item) && (item.parent.flags & ts.NodeFlags.Const) !== 0
      ? item.initializer
      : null;
  };
  const expand = (node, seen = new Set()) => {
    node = unwrap(node);
    if (!node || seen.has(node)) return node;
    const next = initializer(node);
    return next ? expand(next, new Set([...seen, node])) : node;
  };
  const fromCommands = (node) => {
    for (let parent = node; parent; parent = parent.parent) {
      if (ts.isImportDeclaration(parent)) return parent.moduleSpecifier.text === commandModule;
    }
    return false;
  };
  const isNamespace = (node) => {
    node = expand(node);
    const item = ts.isIdentifier(node) && declaration(node);
    return item && ts.isNamespaceImport(item) && fromCommands(item);
  };
  const isClipboard = (node) => {
    const member = property(expand(node));
    if (!member || member.name !== "clipboard") return false;
    const receiver = expand(member.receiver);
    return ts.isIdentifier(receiver) && receiver.text === "navigator" && !declaration(receiver);
  };
  const command = (node) => {
    node = expand(node);
    if (ts.isIdentifier(node)) {
      const item = declaration(node);
      if (item && ts.isImportSpecifier(item) && fromCommands(item)) {
        const name = item.propertyName?.text ?? item.name.text;
        if (commandNames.has(name)) return name;
      }
    }
    const member = property(node);
    if (member && commandNames.has(member.name) && isNamespace(member.receiver)) return member.name;
    if (member && clipboardNames.has(member.name) && isClipboard(member.receiver))
      return `clipboard.${member.name}`;
    return null;
  };
  const enclosingFunction = (node) => {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (isFunction(parent)) return parent;
    return null;
  };
  const rootHook = (call, callback) => {
    if (!ts.isCallExpression(call) || !call.arguments.includes(callback)) return false;
    const callee = unwrap(call.expression);
    if (ts.isIdentifier(callee)) return testHooks.has(callee.text) && !declaration(callee);
    const member = property(callee);
    return (
      member &&
      ["only", "skip"].includes(member.name) &&
      ts.isIdentifier(member.receiver) &&
      testHooks.has(member.receiver.text) &&
      !declaration(member.receiver)
    );
  };
  const ownership = new Map();
  const ownsFunction = (fn, visiting = new Set()) => {
    if (!fn || visiting.has(fn)) return false;
    if (ownership.has(fn)) return ownership.get(fn);
    const next = new Set([...visiting, fn]);
    let owned = false;
    let wrapped = fn;
    while (ts.isParenthesizedExpression(wrapped.parent)) wrapped = wrapped.parent;
    if (rootHook(wrapped.parent, wrapped)) owned = true;
    else if (ts.isCallExpression(wrapped.parent) && wrapped.parent.expression === wrapped)
      owned = ownsExpression(wrapped.parent, next);
    else if (ts.isCallExpression(wrapped.parent) && wrapped.parent.arguments.includes(wrapped)) {
      // Only a known command promise proves this is really Promise.then/finally,
      // rather than an unrelated API that discards its callback's return value.
      const member = property(wrapped.parent.expression);
      const receiver = member && unwrap(member.receiver);
      owned =
        !!member &&
        ["then", "finally"].includes(member.name) &&
        ts.isCallExpression(receiver) &&
        !!command(receiver.expression) &&
        ownsExpression(wrapped.parent, next);
    } else {
      const name = ts.isFunctionDeclaration(fn)
        ? fn.name
        : ts.isVariableDeclaration(fn.parent)
          ? fn.parent.name
          : null;
      const target = name && ts.isIdentifier(name) && symbol(name);
      if (target) {
        const references = nodes.filter(
          (node) => ts.isIdentifier(node) && node !== name && symbol(node) === target
        );
        owned =
          references.length > 0 &&
          references.every((reference) => {
            const call = reference.parent;
            return (
              ts.isCallExpression(call) &&
              call.expression === reference &&
              ownsExpression(call, next)
            );
          });
      }
    }
    ownership.set(fn, owned);
    return owned;
  };
  const ownsExpression = (expression, visiting = new Set()) => {
    let parent = expression.parent;
    while (
      parent &&
      (ts.isParenthesizedExpression(parent) ||
        ts.isAsExpression(parent) ||
        ts.isNonNullExpression(parent) ||
        ts.isSatisfiesExpression(parent))
    ) {
      expression = parent;
      parent = parent.parent;
    }
    if (parent && ts.isAwaitExpression(parent))
      return ownsFunction(enclosingFunction(parent), visiting);
    if (parent && ts.isReturnStatement(parent))
      return ownsFunction(enclosingFunction(parent), visiting);
    if (parent && ts.isArrowFunction(parent) && parent.body === expression)
      return ownsFunction(parent, visiting);
    if (parent && ts.isArrayLiteralExpression(parent) && ts.isCallExpression(parent.parent)) {
      const aggregate = parent.parent;
      const member = property(aggregate.expression);
      if (
        aggregate.arguments[0] === parent &&
        member?.name === "all" &&
        ts.isIdentifier(member.receiver) &&
        member.receiver.text === "Promise" &&
        !declaration(member.receiver)
      )
        return ownsExpression(aggregate, visiting);
    }
    if (
      parent &&
      ts.isPropertyAccessExpression(parent) &&
      parent.expression === expression &&
      ["then", "finally"].includes(parent.name.text) &&
      ts.isCallExpression(parent.parent)
    )
      return ownsExpression(parent.parent, visiting);
    return false;
  };
  const problems = [];
  const add = (node, name, reason) => {
    const position = file.getLineAndCharacterOfPosition(node.getStart());
    problems.push({
      file: filename,
      line: position.line + 1,
      column: position.character + 1,
      command: name,
      reason
    });
  };
  let calls = 0;
  for (const node of nodes) {
    if (ts.isCallExpression(node)) {
      const name = command(node.expression);
      if (name) {
        calls++;
        if (!ownsExpression(node))
          add(node, name, "Command promise is not owned by an awaited/returned test or hook chain");
      }
    }
    if (
      !ts.isIdentifier(node) &&
      !ts.isPropertyAccessExpression(node) &&
      !ts.isElementAccessExpression(node)
    )
      continue;
    const name =
      command(node) ??
      (isNamespace(node)
        ? "browser-command namespace"
        : isClipboard(node)
          ? "clipboard object"
          : null);
    if (!name) continue;
    let value = node;
    let parent = value.parent;
    while (
      parent &&
      (ts.isParenthesizedExpression(parent) ||
        ts.isAsExpression(parent) ||
        ts.isNonNullExpression(parent) ||
        ts.isSatisfiesExpression(parent))
    ) {
      value = parent;
      parent = parent.parent;
    }
    // Declaration names and a command's own member name are not value references.
    if (
      (ts.isImportSpecifier(parent) ||
        ts.isNamespaceImport(parent) ||
        ts.isVariableDeclaration(parent)) &&
      parent.name === node
    )
      continue;
    if (ts.isImportSpecifier(parent) && parent.propertyName === node) continue;
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) continue;
    if (
      (name === "browser-command namespace" || name === "clipboard object") &&
      property(parent)?.receiver === value
    )
      continue;
    if (ts.isCallExpression(parent) && parent.expression === value) continue;
    // Immutable aliases are followed by symbol identity; their uses are checked.
    if (
      ts.isVariableDeclaration(parent) &&
      parent.initializer === value &&
      (parent.parent.flags & ts.NodeFlags.Const) !== 0
    )
      continue;
    add(node, name, "Command reference escapes the bounded ownership proof");
  }
  return { calls, problems };
}

export async function checkBrowserCommandOwnership(root) {
  const files = [];
  const skipped = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "test-results",
    "playwright-report",
    "storybook-static",
    ".next",
    ".astro",
    ".svelte-kit"
  ]);
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !skipped.has(entry.name)) await walk(path);
      else if (entry.isFile() && entry.name.endsWith(".test.ts")) files.push(path);
    }
  };
  for (const directory of ["packages", "apps"]) await walk(join(root, directory));
  const result = { files: files.length, calls: 0, problems: [] };
  for (const file of files.sort()) {
    const inspected = inspectBrowserCommandOwnership(
      await readFile(file, "utf8"),
      relative(root, file).replaceAll("\\", "/")
    );
    result.calls += inspected.calls;
    result.problems.push(...inspected.problems);
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkBrowserCommandOwnership(
    dirname(dirname(fileURLToPath(import.meta.url)))
  );
  console.log(JSON.stringify(result, null, 2));
  if (result.problems.length) process.exitCode = 1;
}
