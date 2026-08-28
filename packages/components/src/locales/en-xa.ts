import { createPseudoTranslation, registerTranslation } from "../internal/localization.js";

const accents: Record<string, string> = {
  a: "á",
  A: "Á",
  e: "ë",
  E: "Ë",
  i: "ï",
  I: "Ï",
  o: "ô",
  O: "Ô",
  u: "ü",
  U: "Ü",
  y: "ÿ",
  Y: "Ÿ"
};

function expand(value: string): string {
  const accented = [...value].map((character) => accents[character] ?? character).join("");
  const padding = "~".repeat(Math.max(3, Math.ceil(value.length * 0.35)));
  return `[!! ${accented} ${padding} !!]`;
}

/** Expanded accented LTR locale for clipping and hardcoded-string diagnostics. */
export const enXA = createPseudoTranslation("en-XA", "ltr", expand);

registerTranslation(enXA);
export default enXA;
