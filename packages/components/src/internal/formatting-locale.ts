/**
 * Resolve formatter locales without changing the translation registry's policy.
 * Explicit locales retain their Intl error behavior, including empty strings.
 * Otherwise use declared DOM language across shadow hosts, then English. The
 * English tail makes unsupported languages independent of the browser default.
 *
 * This reads no browser globals. The Fluid SSR renderer binds parser-derived
 * native ancestry to the localization controller before formatter rendering.
 * FluidElement's localization controller already requests updates when a
 * connected host's language context changes; no extra observer is needed here.
 */
export function formattingLocales(host: Element, explicit: string | null | undefined): string[] {
  if (explicit != null) return [explicit, "en"];

  for (let current: Element | null = host; current; ) {
    const language = current.getAttribute?.("lang");
    if (language != null) {
      // An empty or malformed nearest declaration is a boundary, not permission
      // to adopt a more distant ancestor's language.
      try {
        return [...Intl.getCanonicalLocales(language.trim()), "en"];
      } catch {
        return ["en"];
      }
    }
    if (current.parentElement) {
      current = current.parentElement;
    } else {
      const parent: ParentNode | null = current.parentNode;
      current = parent && "host" in parent ? (parent as ShadowRoot).host : null;
    }
  }
  return ["en"];
}
