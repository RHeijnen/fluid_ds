import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const app = dirname(here);
const entries = {
  dialog: "@fluid-ds/components/define/dialog",
  input: "@fluid-ds/components/define/input"
};

for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(entries)) {
  const entry = entries[name];
  if (!entry) throw new Error(`Unknown bundle analysis case ${name}`);
  const result = await build({
    bundle: true,
    conditions: ["browser", "import"],
    format: "esm",
    logLevel: "silent",
    metafile: true,
    minify: true,
    platform: "browser",
    stdin: { contents: `import "${entry}";`, loader: "ts", resolveDir: app },
    treeShaking: true,
    write: false
  });
  const inputs = Object.entries(Object.values(result.metafile.outputs)[0].inputs)
    .map(([path, contribution]) => ({
      path: path.replaceAll("\\", "/"),
      bytesInOutput: contribution.bytesInOutput
    }))
    .filter(({ bytesInOutput }) => bytesInOutput > 0)
    .sort((a, b) => b.bytesInOutput - a.bytesInOutput);
  console.log(
    JSON.stringify(
      {
        name,
        entry,
        bytes: result.outputFiles[0].contents.byteLength,
        gzipBytes: gzipSync(result.outputFiles[0].contents, { level: 9 }).byteLength,
        modules: inputs.length,
        inputs
      },
      null,
      2
    )
  );
}
