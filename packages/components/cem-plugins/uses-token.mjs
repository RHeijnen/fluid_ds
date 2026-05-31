/**
 * CEM analyzer plugin, picks up `@uses-token --fluid-… - description` JSDoc
 * tags on class declarations and attaches them to the declaration as
 * `usesTokens: [{ name, description }]`.
 *
 * Tells downstream consumers (like the Fluid theme builder's Design Mode)
 * which semantic tokens a component reads via `var(...)`, so the sidebar
 * can show "these are the semantics affecting this component" without the
 * consumer parsing CSS or hand-maintaining the list.
 *
 * Usage in JSDoc:
 *
 *   /**
 *    * @uses-token --fluid-accent-base - Background of the primary variant.
 *    * @uses-token --fluid-focus-ring-color - Keyboard focus indicator.
 *    *\/
 *   export class FluidButton extends FluidElement { ... }
 */
export function usesTokenPlugin() {
  return {
    name: "uses-token",
    analyzePhase({ ts, node, moduleDoc }) {
      if (!ts.isClassDeclaration(node)) return;
      const className = node.name?.text;
      if (!className) return;

      const usesTokens = [];
      // Walk JSDoc nodes attached to the class declaration.
      const jsDocs = ts.getJSDocCommentsAndTags(node);
      for (const jsDoc of jsDocs) {
        const tags = jsDoc.tags ?? [];
        for (const tag of tags) {
          if (tag.tagName?.text !== "uses-token") continue;
          const comment = typeof tag.comment === "string"
            ? tag.comment
            : Array.isArray(tag.comment)
              ? tag.comment.map((c) => c.text ?? "").join("")
              : "";
          // Format: "--fluid-name - Description text" (description optional)
          const match = /^\s*(--[\w-]+)(?:\s*-\s*(.+))?$/.exec(comment.trim());
          if (match) {
            usesTokens.push({
              name: match[1],
              description: match[2]?.trim()
            });
          }
        }
      }
      if (!usesTokens.length) return;

      const decl = (moduleDoc.declarations ?? []).find((d) => d.name === className);
      if (decl) decl.usesTokens = usesTokens;
    }
  };
}
