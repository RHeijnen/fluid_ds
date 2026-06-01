# @fluid-ds/parser

Drop a JSON / CSV / Excel file onto a [Fluid](https://fluid-web.dev) file-drop
and get validated, typed rows out. Shipped as an opt-in expansion pack.

You describe the shape you want with a declarative **blueprint** (fields with
types, aliases, ranges, and validators); the parser sniffs the file format,
fuzzy-maps the source columns to your fields, coerces and validates every cell,
and hands back clean typed rows plus a full error report. A mapping UI and an
error-preview table come with it. Built on standard web components: works in
React, Vue, Angular, Svelte, or plain HTML.

> Alpha. Install with the `alpha` tag: `npm i @fluid-ds/parser@alpha`.

## What's inside

- A **headless core** (`@fluid-ds/parser/core`): `parseFile` (JSON / CSV / TSV
  natively, XLSX via a lazily-imported SheetJS) and `applyBlueprint`
  (auto-map + coerce + validate + dedupe). Zero UI, zero DOM, runs server-side.
- **`fluid-file-parser`** the full flow: a `fluid-dropzone` intake, an
  auto-mapping step, a validated preview table with per-cell error highlighting,
  a confirm action, and CSV / JSON download of the cleaned data.
- **`fluid-column-mapper`** the source-column to blueprint-field mapping UI,
  usable on its own.

## Headless quick start

```ts
import { parseFile, applyBlueprint, type Blueprint } from "@fluid-ds/parser/core";

const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Full name", type: "string", required: true, aliases: ["name"] },
    { key: "email", type: "email", required: true },
    { key: "age", type: "integer", min: 0, max: 120 },
    { key: "role", type: "enum", options: ["engineer", "designer"], default: "engineer" }
  ],
  dedupeBy: "email",
  maxRows: 5000
};

const raw = await parseFile(file); // file: File from a drop / <input>
const result = applyBlueprint(raw, blueprint);

result.rows;    // cleaned, typed rows
result.errors;  // [{ row, field, value, message }, …]
result.mapping; // { name: "Full Name", email: "E-mail", … }
result.stats;   // { total, kept, duplicates, truncated, errorCount }
```

`applyBlueprint` is pure: no DOM, no async. The XLSX path in `parseFile` only
imports `xlsx` when an `.xlsx` is actually dropped, so the base bundle stays
small.

## Component quick start

```html
<fluid-file-parser id="importer"></fluid-file-parser>

<script type="module">
  import "@fluid-ds/parser/define/file-parser";

  const importer = document.getElementById("importer");
  importer.blueprint = {
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", type: "email", required: true },
      { key: "age", type: "integer", min: 0 }
    ]
  };

  importer.addEventListener("fluid-parse", (e) => {
    const { valid, rows, errors } = e.detail;
    if (valid) saveRows(rows);
  });
</script>
```

## Blueprint reference

A `FieldSpec` has a `key`, a `type`, and optional rules:

| Option | Applies to | Notes |
| --- | --- | --- |
| `required` | all | Empty / missing value is an error. |
| `aliases` | all | Extra source-column names to auto-map (fuzzy, case-insensitive). |
| `default` | all | Used when the source cell is empty. |
| `min` / `max` | number, integer, date, string | Numeric bound, date bound (ms), or string length. |
| `options` | enum | Allowed values (case-insensitive for strings). |
| `format` | date | `"iso"` (default), `"us"` (M/D/Y), `"eu"` (D/M/Y). |
| `truthy` | boolean | Strings that coerce to `true`. |
| `pattern` | string | RegExp the value must match. |
| `transform(value)` | all | Reshape the coerced value before validation. |
| `validate(value)` | all | Return `true` or a human error message. |

Types: `string`, `number`, `integer`, `boolean`, `date`, `email`, `url`,
`enum`, `json`, `custom`. Blueprint-level: `fields`, `dedupeBy`, `maxRows`,
`headerRow`.

## License

MIT
