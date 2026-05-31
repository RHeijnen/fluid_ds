/**
 * Type-safe read layer over `packages/components/custom-elements.json`.
 *
 * The CEM is read once at module-eval time, indexed by tag name, and the
 * helpers below pull out the per-section data structures used by the
 * `<ComponentApi>` component (attributes, properties, events, slots, CSS
 * parts, CSS custom properties, `uses-token`).
 *
 * We intentionally type the CEM loosely, the spec evolves and we only
 * need the fields the analyzer emits today. If the analyzer drops a field
 * the docs page just shows an empty table for that section.
 */
import rawCem from "@fluid-ds/components/custom-elements.json";

export interface CemMember {
  name: string;
  description?: string;
  type?: { text?: string };
  default?: string;
  attribute?: string;
}
export interface CemEvent {
  name: string;
  description?: string;
  type?: { text?: string };
}
export interface CemSlot {
  name: string;
  description?: string;
}
export interface CemCssPart {
  name: string;
  description?: string;
}
export interface CemCssProperty {
  name: string;
  description?: string;
  default?: string;
}
export interface CemUsesToken {
  name: string;
  description?: string;
}
export interface CemDeclaration {
  kind?: string;
  name?: string;
  tagName?: string;
  description?: string;
  summary?: string;
  members?: CemMember[];
  attributes?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssParts?: CemCssPart[];
  cssProperties?: CemCssProperty[];
  usesTokens?: CemUsesToken[];
}
interface CemModule {
  declarations?: CemDeclaration[];
}
interface Cem {
  modules?: CemModule[];
}

const cem = rawCem as Cem;

/** Build an index of every tag declared in the CEM. */
const INDEX = new Map<string, CemDeclaration>();
for (const mod of cem.modules ?? []) {
  for (const decl of mod.declarations ?? []) {
    if (decl.tagName) INDEX.set(decl.tagName, decl);
  }
}

/** Return the declaration for one custom-element tag (or undefined). */
export function declarationFor(tag: string): CemDeclaration | undefined {
  return INDEX.get(tag);
}

/**
 * Public properties of a class, methods aren't useful in docs, only
 * fields and getters. CEM merges them under `members` with `kind`.
 */
export function publicFields(decl: CemDeclaration | undefined): CemMember[] {
  if (!decl?.members) return [];
  return decl.members.filter((m) => {
    // The analyzer adds a `kind` field on members; types are slightly
    // looser than the lowest common denominator. We treat everything
    // that's not "method" as a field-like.
    const kind = (m as unknown as { kind?: string }).kind;
    const privacy = (m as unknown as { privacy?: string }).privacy;
    if (privacy === "private" || privacy === "protected") return false;
    if (kind === "method") return false;
    return true;
  });
}

export function attributes(decl: CemDeclaration | undefined): CemMember[] {
  return decl?.attributes ?? [];
}

export function events(decl: CemDeclaration | undefined): CemEvent[] {
  return decl?.events ?? [];
}

export function slots(decl: CemDeclaration | undefined): CemSlot[] {
  return decl?.slots ?? [];
}

export function cssParts(decl: CemDeclaration | undefined): CemCssPart[] {
  return decl?.cssParts ?? [];
}

export function cssProperties(decl: CemDeclaration | undefined): CemCssProperty[] {
  return decl?.cssProperties ?? [];
}

export function usesTokens(decl: CemDeclaration | undefined): CemUsesToken[] {
  return decl?.usesTokens ?? [];
}

/** All known tag names, useful for build-time validation in MDX. */
export function allTags(): string[] {
  return Array.from(INDEX.keys()).sort();
}
