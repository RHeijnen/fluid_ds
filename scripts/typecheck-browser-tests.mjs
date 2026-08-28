import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function createBrowserTestProgram(packageRoot) {
  const configFile = join(packageRoot, "tsconfig.json");
  const loaded = ts.readConfigFile(configFile, ts.sys.readFile);
  if (loaded.error)
    throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, "\n"));
  const sourceConfig = ts.parseJsonConfigFileContent(loaded.config, ts.sys, packageRoot);
  const config = ts.parseJsonConfigFileContent(
    {
      ...loaded.config,
      include: ["src/**/*.test.ts"],
      exclude: ["node_modules"],
      compilerOptions: {
        ...loaded.config.compilerOptions,
        noEmit: true,
        types: [...new Set([...(sourceConfig.options.types ?? []), "mocha"])]
      }
    },
    ts.sys,
    packageRoot
  );
  const tests = config.fileNames.filter((file) => file.endsWith(".test.ts"));
  if (!tests.length) throw new Error(`No browser test files found: ${packageRoot}`);
  const program = ts.createProgram(config.fileNames, config.options);
  return {
    tests,
    diagnostics: [...config.errors, ...ts.getPreEmitDiagnostics(program)]
  };
}

export async function typecheckBrowserTests() {
  const catalog = JSON.parse(await readFile(join(root, "quality/component-quality.json"), "utf8"));
  const packages = [...new Set(catalog.components.map((component) => component.package))].sort();
  if (!packages.length || packages.some((name) => !/^@fluid-ds\/[a-z][a-z0-9-]*$/.test(name)))
    throw new Error("Invalid browser-test package inventory");
  let failures = 0;
  let count = 0;
  for (const name of packages) {
    const { tests, diagnostics } = createBrowserTestProgram(
      join(root, "packages", name.slice("@fluid-ds/".length))
    );
    count += tests.length;
    failures += diagnostics.length;
    console.log(`${name}: ${tests.length} browser test files, ${diagnostics.length} diagnostics`);
    if (diagnostics.length)
      console.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (file) => file,
          getCurrentDirectory: ts.sys.getCurrentDirectory,
          getNewLine: () => "\n"
        })
      );
  }
  console.log(`Browser test typecheck: ${count} files across ${packages.length} packages`);
  return failures === 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!(await typecheckBrowserTests())) process.exitCode = 1;
}
