import { createPseudoTranslation, registerTranslation } from "../internal/localization.js";

function mirror(value: string): string {
  return `\u202e[${value}]\u202c`;
}

/** Mirrored RTL locale for physical-layout and direction diagnostics. */
export const arXB = createPseudoTranslation("ar-XB", "rtl", mirror);

registerTranslation(arXB);
export default arXB;
