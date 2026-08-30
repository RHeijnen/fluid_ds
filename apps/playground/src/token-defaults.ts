/**
 * Resolve what a component token is *currently worth* on a given element, so
 * the inspector can show a real starting value instead of an empty field.
 *
 * Component tokens are deliberately never declared. The house convention is an
 * inline fallback at the point of use:
 *
 *     background-color: var(--fluid-button-bg, var(--fluid-accent-base));
 *
 * That is what makes the brand -> component -> instance override ladder work,
 * but it also means the token has no value to read back:
 * `getComputedStyle(el).getPropertyValue("--fluid-button-bg")` returns "" for an
 * undeclared, unregistered custom property, however obviously the button is
 * painted on screen. The default lives in the stylesheet, as the second
 * argument of the `var()`, not in the cascade.
 *
 * So we read it from the stylesheet the component actually adopted, then ask
 * the browser to substitute it. Two details matter:
 *
 *  - The value is resolved by the engine, via a temporary probe property, not
 *    by us. Fallbacks are arbitrary CSS (`var(--a, var(--b, #fff))`,
 *    `color-mix(...)`), and re-implementing substitution would drift from what
 *    the page really renders.
 *  - The rule has to be one that applies to this element. A token usually
 *    appears several times with different fallbacks per variant, so
 *    `--fluid-button-bg` is `--fluid-accent-base` under `.variant-primary` and
 *    something else under `.variant-ghost`. Matching the rule against the
 *    rendered node picks the right one for the instance in hand.
 */

/** Scratch property used to make the engine substitute a fallback expression. */
const PROBE = "--fluid-token-probe";

interface FallbackRule {
  selector: string;
  /** The `var()` fallback expression, e.g. "var(--fluid-accent-base)". */
  expression: string;
}

/** Parsed rules per custom-element tag; stylesheets are static per component. */
const cache = new Map<string, Map<string, FallbackRule[]>>();

/**
 * Every `var(<--fluid-token>, <fallback>)` reference in a declaration block.
 *
 * The pattern tolerates whitespace after `var(` and around the token, because
 * the CSSOM hands back the declaration with the source formatting intact and
 * the formatter wraps long references:
 *
 *     background-color: var(
 *       --fluid-button-hover-bg,
 *       var(--fluid-button-bg, var(--fluid-accent-hover))
 *     );
 *
 * A pattern anchored on `var(--fluid-` would skip that outer reference and
 * only ever see the inner one, which silently indexes the wrong token.
 */
const VAR_REFERENCE = /var\(\s*(--fluid-[\w-]+)\s*,/g;

/**
 * The fallback of the `var()` whose `(` sits at `open`, given the offset just
 * past its comma.
 *
 * Counts parens rather than scanning to the next `)`: fallbacks nest
 * (`var(--a, var(--b, 0))`) and contain commas, so neither the first `)` nor a
 * split on `,` finds the right boundary.
 */
function fallbackAt(text: string, open: number, fallbackStart: number): string | null {
  let depth = 0;
  for (let i = open + 3; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return text.slice(fallbackStart, i).trim() || null;
    }
  }
  return null;
}

/** Index every token fallback in a component's adopted stylesheets. */
function indexRules(host: Element): Map<string, FallbackRule[]> {
  const byToken = new Map<string, FallbackRule[]>();
  const sheets = host.shadowRoot?.adoptedStyleSheets ?? [];
  const visit = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      const style = rule as CSSStyleRule;
      // Read this rule's own declarations, then descend. Both, not either:
      // now that CSS nesting is supported, every CSSStyleRule carries a
      // `cssRules` list of its own (usually empty, and an empty CSSRuleList is
      // still truthy), so treating "has cssRules" as "is a grouping rule"
      // skips past every real declaration in the sheet.
      //
      // `style.style.cssText` is the declaration block alone: `rule.cssText`
      // would include any nested rules and index their fallbacks against this
      // rule's selector.
      const text = style.style?.cssText;
      if (text?.includes("--fluid-")) {
        for (const match of text.matchAll(VAR_REFERENCE)) {
          const token = match[1]!;
          const expression = fallbackAt(text, match.index!, match.index! + match[0].length);
          if (!expression) continue;
          const list = byToken.get(token) ?? [];
          list.push({ selector: style.selectorText, expression });
          byToken.set(token, list);
        }
      }
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested?.length) visit(nested);
    }
  };
  for (const sheet of sheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // A cross-origin sheet refuses cssRules access. Nothing to index.
    }
  }
  return byToken;
}

/**
 * Drop pseudo-classes describing a transient interaction state.
 *
 * `.variant-primary:hover` never matches while nothing is hovered, so the
 * hover token would read as "no default" even though it plainly has one. The
 * fallback recorded on that rule is still the right answer for the token, so
 * the state qualifier is removed and the underlying element matched instead.
 *
 * Only interaction states are stripped. Structural ones like `:disabled` are
 * left in place: if they do not match, the token really does not apply to this
 * instance, and inventing a value for it would be a lie.
 */
function stripInteractionStates(selector: string): string {
  // Longest alternative first. With `focus` ahead of `focus-visible`, the
  // alternation matches `:focus` inside `:focus-visible` and leaves the
  // trailing `-visible` glued to the selector (`.button-visible`), which then
  // matches nothing.
  return selector.replace(/:(focus-visible|focus-within|focus|hover|active)\b/g, "");
}

/** The node a rule styles, or null when the rule does not apply here. */
function nodeFor(host: HTMLElement, selector: string): HTMLElement | null {
  if (!selector) return null;
  const attempts = [selector, stripInteractionStates(selector)];
  for (const attempt of attempts) {
    const trimmed = attempt.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(":host")) {
      const condition = /^:host\((.*)\)$/.exec(trimmed);
      if (!condition) return host;
      try {
        if (host.matches(condition[1]!)) return host;
      } catch {
        // An unparseable condition is simply not a match.
      }
      continue;
    }
    try {
      const node = host.shadowRoot?.querySelector<HTMLElement>(trimmed);
      if (node) return node;
    } catch {
      // Selectors carrying ::part / ::slotted are not queryable from here.
    }
  }
  return null;
}

/**
 * The value `token` resolves to on `host` right now, or "" when the component
 * does not use the token or nothing about it can be resolved.
 */
export function resolveTokenDefault(host: HTMLElement | null, token: string): string {
  if (!host?.shadowRoot) return "";
  const tag = host.tagName.toLowerCase();
  let byToken = cache.get(tag);
  // An empty index is not cached. Styles are adopted asynchronously, so an
  // early call can see a shadow root whose stylesheet has no rules yet, and
  // caching that emptiness would keep every token blank for the rest of the
  // session even once the real rules arrive.
  if (!byToken?.size) {
    byToken = indexRules(host);
    if (byToken.size) cache.set(tag, byToken);
  }
  const candidates = byToken.get(token);
  if (!candidates?.length) return "";

  for (const candidate of candidates) {
    const node = nodeFor(host, candidate.selector);
    if (!node) continue;
    // Let the engine substitute the expression, then take the probe back out
    // so the element is left exactly as it was found.
    node.style.setProperty(PROBE, candidate.expression);
    const resolved = getComputedStyle(node).getPropertyValue(PROBE).trim();
    node.style.removeProperty(PROBE);
    if (resolved) return resolved;
  }
  return "";
}
