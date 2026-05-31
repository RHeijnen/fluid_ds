/**
 * CEM analyzer plugin: make the emitted manifest deterministic.
 *
 * The analyzer discovers modules via a glob, and the glob's file order is not
 * guaranteed stable across runs / machines / OSes. That made every
 * `cem analyze` reshuffle the `modules` array, producing huge reorder-only
 * diffs in `custom-elements.json` even when nothing actually changed.
 *
 * In the final `packageLinkPhase` (runs once with the whole manifest) we sort
 * `modules` by `path`, and within each module sort `exports` and `declarations`
 * by a stable key. We deliberately do NOT reorder a declaration's `members`,
 * `attributes`, `cssProperties`, etc. — those follow authored source order,
 * which is already deterministic and carries meaning.
 *
 * Uses a plain codepoint comparator (not localeCompare) so the order can't
 * shift with the active locale.
 */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function sortManifestPlugin() {
  return {
    name: "sort-manifest",
    packageLinkPhase({ customElementsManifest }) {
      const cem = customElementsManifest;
      if (!cem || !Array.isArray(cem.modules)) return;

      cem.modules.sort((a, b) => cmp(a.path ?? "", b.path ?? ""));

      for (const mod of cem.modules) {
        if (Array.isArray(mod.exports)) {
          mod.exports.sort((a, b) => cmp(a.kind ?? "", b.kind ?? "") || cmp(a.name ?? "", b.name ?? ""));
        }
        if (Array.isArray(mod.declarations)) {
          mod.declarations.sort((a, b) => cmp(a.name ?? "", b.name ?? ""));
        }
      }
    }
  };
}
