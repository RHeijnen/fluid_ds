import { readFile, readdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep, win32 } from "node:path";
import ts from "typescript";

const excluded = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".angular",
  ".astro",
  ".svelte-kit",
  "out-tsc"
]);

/** Reject workspace-relative compiler configuration before installing a consumer. */
export function validateConfigIsolation(config, filename, fixtureRoot) {
  const check = (value, field, packageReference = false) => {
    if (typeof value !== "string") return;
    if (
      packageReference &&
      !value.startsWith(".") &&
      !isAbsolute(value) &&
      !win32.isAbsolute(value)
    )
      return;
    const target = resolve(dirname(filename), value);
    const offset = relative(resolve(fixtureRoot), target);
    if (
      isAbsolute(value) ||
      win32.isAbsolute(value) ||
      offset === ".." ||
      offset.startsWith(`..${sep}`) ||
      isAbsolute(offset)
    ) {
      throw new Error(
        `${relative(fixtureRoot, filename)} ${field} escapes the isolated fixture: ${value}`
      );
    }
  };
  for (const value of [config.extends].flat()) check(value, "extends", true);
  for (const ref of config.references ?? []) check(ref.path, "references");
  for (const field of ["files", "include", "exclude"]) {
    for (const value of config[field] ?? []) check(value, field);
  }
  const options = config.compilerOptions ?? {};
  for (const field of ["baseUrl", "rootDir", "outDir", "declarationDir"])
    check(options[field], field);
  for (const field of ["rootDirs", "typeRoots"]) {
    for (const value of options[field] ?? []) check(value, field);
  }
  for (const [name, values] of Object.entries(options.paths ?? {})) {
    for (const value of values) {
      const base = options.baseUrl
        ? resolve(dirname(filename), options.baseUrl)
        : dirname(filename);
      check(relative(dirname(filename), resolve(base, value)), `paths[${name}]`);
    }
  }
}

export async function checkFixtureIsolation(fixtureRoot) {
  let count = 0;
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (excluded.has(entry.name)) continue;
      const filename = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(filename);
      else if (/^tsconfig(?:\..+)?\.json$/.test(entry.name)) {
        const parsed = ts.parseConfigFileTextToJson(filename, await readFile(filename, "utf8"));
        if (parsed.error)
          throw new Error(
            `Cannot parse ${filename}: ${ts.flattenDiagnosticMessageText(parsed.error.messageText, " ")}`
          );
        validateConfigIsolation(parsed.config, filename, fixtureRoot);
        count++;
      }
    }
  }
  await walk(fixtureRoot);
  return count;
}
