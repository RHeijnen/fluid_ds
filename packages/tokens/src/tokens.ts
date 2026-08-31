/**
 * Fluid, Design Tokens (source of truth).
 *
 * Schema is W3C Design Tokens (DTCG)-compatible. The build script in
 * scripts/build.ts walks this tree and emits:
 *   - dist/base.css       (CSS custom properties for primitives)
 *   - dist/light.css      (semantic tokens for light scheme)
 *   - dist/dark.css       (semantic tokens for dark scheme)
 *   - dist/manifest.json  (structured data for the theme builder)
 *
 * References use `{dotted.path}` syntax and are resolved to var(--fluid-…)
 * at build time so semantics cascade off primitives at runtime.
 */

export type TokenType =
  | "color"
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "shadow"
  | "string";

export interface TokenLeaf {
  $value: string;
  $type: TokenType;
  $description?: string;
  /** When true, this token is exposed in the theme builder UI. */
  $userFacing?: boolean;
  /** When set, the theme builder renders this min/max for numeric controls. */
  $range?: { min: number; max: number; step?: number; unit?: string };
}

export interface TokenGroup {
  $label?: string;
  $description?: string;
  [key: string]:
    | TokenLeaf
    | TokenGroup
    | string
    | undefined
    | { min: number; max: number; step?: number; unit?: string };
}

const t = (
  value: string,
  type: TokenType,
  opts: Partial<Omit<TokenLeaf, "$value" | "$type">> = {}
): TokenLeaf => ({ $value: value, $type: type, ...opts });

/* ────────────────────────────────────────────────────────────────────────── */
/* Primitive tokens, the building blocks. Generated into dist/base.css.       */
/* ────────────────────────────────────────────────────────────────────────── */

export const primitives = {
  color: {
    $label: "Colors",
    white: t("#ffffff", "color"),
    black: t("#000000", "color"),
    neutral: {
      $label: "Neutral",
      $description: "Grayscale ramp used for surfaces, text, borders.",
      50: t("#fafafa", "color"),
      100: t("#f4f4f5", "color"),
      200: t("#e4e4e7", "color"),
      300: t("#d4d4d8", "color"),
      400: t("#a1a1aa", "color"),
      500: t("#71717a", "color"),
      600: t("#52525b", "color"),
      700: t("#3f3f46", "color"),
      800: t("#27272a", "color"),
      900: t("#18181b", "color"),
      950: t("#09090b", "color")
    },
    brand: {
      $label: "Brand",
      $description: "Primary accent color scale. The single thing most users override.",
      50: t("#eff6ff", "color", { $userFacing: true }),
      100: t("#dbeafe", "color", { $userFacing: true }),
      200: t("#bfdbfe", "color", { $userFacing: true }),
      300: t("#93c5fd", "color", { $userFacing: true }),
      400: t("#60a5fa", "color", { $userFacing: true }),
      500: t("#3b82f6", "color", { $userFacing: true }),
      600: t("#2563eb", "color", { $userFacing: true }),
      700: t("#1d4ed8", "color", { $userFacing: true }),
      800: t("#1e40af", "color", { $userFacing: true }),
      900: t("#1e3a8a", "color", { $userFacing: true })
    },
    /*
     * Semantic status ramps. Theme-independent, switching brand from
     * default to midnight does NOT recolor success / danger / warning /
     * info. They're the universal vocabulary of "this happened" and
     * keeping them stable means a delete button is always red regardless
     * of brand. Each ramp picked to hit WCAG 2.1 AA 4.5:1 contrast on
     * its declared "base" stop with the declared "text" stop (see the
     * semantic groups in §Semantics below).
     */
    emerald: {
      $label: "Emerald (success)",
      50: t("#ecfdf5", "color"),
      100: t("#d1fae5", "color"),
      200: t("#a7f3d0", "color"),
      300: t("#6ee7b7", "color"),
      400: t("#34d399", "color"),
      500: t("#10b981", "color"),
      600: t("#059669", "color"),
      700: t("#047857", "color"),
      800: t("#065f46", "color"),
      900: t("#064e3b", "color")
    },
    red: {
      $label: "Red (danger)",
      50: t("#fef2f2", "color"),
      100: t("#fee2e2", "color"),
      200: t("#fecaca", "color"),
      300: t("#fca5a5", "color"),
      400: t("#f87171", "color"),
      500: t("#ef4444", "color"),
      600: t("#dc2626", "color"),
      700: t("#b91c1c", "color"),
      800: t("#991b1b", "color"),
      900: t("#7f1d1d", "color")
    },
    amber: {
      $label: "Amber (warning)",
      50: t("#fffbeb", "color"),
      100: t("#fef3c7", "color"),
      200: t("#fde68a", "color"),
      300: t("#fcd34d", "color"),
      400: t("#fbbf24", "color"),
      500: t("#f59e0b", "color"),
      600: t("#d97706", "color"),
      700: t("#b45309", "color"),
      800: t("#92400e", "color"),
      900: t("#78350f", "color")
    },
    sky: {
      $label: "Sky (info)",
      50: t("#f0f9ff", "color"),
      100: t("#e0f2fe", "color"),
      200: t("#bae6fd", "color"),
      300: t("#7dd3fc", "color"),
      400: t("#38bdf8", "color"),
      500: t("#0ea5e9", "color"),
      600: t("#0284c7", "color"),
      700: t("#0369a1", "color"),
      800: t("#075985", "color"),
      900: t("#0c4a6e", "color")
    }
  },
  font: {
    $label: "Typography",
    family: {
      $label: "Font families",
      sans: t(
        '"Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        "fontFamily",
        { $userFacing: true }
      ),
      mono: t(
        '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        "fontFamily",
        { $userFacing: true }
      )
    },
    size: {
      $label: "Font sizes",
      // 11px, tiny labels, badges, captions
      xs: t("0.6875rem", "dimension", {
        $userFacing: true,
        $range: { min: 0.5, max: 0.875, step: 0.0625, unit: "rem" }
      }),
      // 12px, secondary text, dense controls
      sm: t("0.75rem", "dimension", {
        $userFacing: true,
        $range: { min: 0.625, max: 1, step: 0.0625, unit: "rem" }
      }),
      // 14px, default UI text (sm controls + most body)
      md: t("0.875rem", "dimension", {
        $userFacing: true,
        $range: { min: 0.75, max: 1.125, step: 0.0625, unit: "rem" }
      }),
      // 16px, comfortable body text, md controls
      lg: t("1rem", "dimension", {
        $userFacing: true,
        $range: { min: 0.875, max: 1.25, step: 0.0625, unit: "rem" }
      }),
      // 18px, large controls, callouts
      xl: t("1.125rem", "dimension", {
        $userFacing: true,
        $range: { min: 1, max: 1.5, step: 0.0625, unit: "rem" }
      }),
      // 20px, h4
      "2xl": t("1.25rem", "dimension", {
        $userFacing: true,
        $range: { min: 1.125, max: 1.75, step: 0.0625, unit: "rem" }
      }),
      // 24px, h3
      "3xl": t("1.5rem", "dimension", {
        $userFacing: true,
        $range: { min: 1.25, max: 2, step: 0.0625, unit: "rem" }
      }),
      // 30px, h2 / page titles
      "4xl": t("1.875rem", "dimension", {
        $userFacing: true,
        $range: { min: 1.5, max: 2.5, step: 0.0625, unit: "rem" }
      })
    },
    weight: {
      $label: "Font weights",
      regular: t("400", "fontWeight"),
      medium: t("500", "fontWeight"),
      semibold: t("600", "fontWeight"),
      bold: t("700", "fontWeight")
    },
    lineHeight: {
      $label: "Line heights",
      tight: t("1.2", "number"),
      snug: t("1.4", "number"),
      normal: t("1.5", "number"),
      relaxed: t("1.625", "number")
    },
    letterSpacing: {
      $label: "Letter spacing",
      tight: t("-0.01em", "dimension"),
      normal: t("0", "dimension"),
      wide: t("0.02em", "dimension"),
      widest: t("0.08em", "dimension")
    }
  },
  space: {
    $label: "Spacing",
    $description: "4px-based spacing scale. Used for padding, gap, margin.",
    0: t("0", "dimension"),
    1: t("0.25rem", "dimension"),
    2: t("0.5rem", "dimension"),
    3: t("0.75rem", "dimension"),
    4: t("1rem", "dimension"),
    5: t("1.25rem", "dimension"),
    6: t("1.5rem", "dimension"),
    8: t("2rem", "dimension"),
    10: t("2.5rem", "dimension"),
    12: t("3rem", "dimension")
  },
  radius: {
    $label: "Radii",
    none: t("0", "dimension"),
    sm: t("0.25rem", "dimension", {
      $userFacing: true,
      $range: { min: 0, max: 0.5, step: 0.0625, unit: "rem" }
    }),
    md: t("0.5rem", "dimension", {
      $userFacing: true,
      $range: { min: 0, max: 1, step: 0.0625, unit: "rem" }
    }),
    lg: t("0.75rem", "dimension", {
      $userFacing: true,
      $range: { min: 0, max: 1.5, step: 0.0625, unit: "rem" }
    }),
    xl: t("1rem", "dimension", {
      $userFacing: true,
      $range: { min: 0, max: 2, step: 0.0625, unit: "rem" }
    }),
    full: t("9999px", "dimension")
  },
  duration: {
    $label: "Motion durations",
    fast: t("120ms", "duration", {
      $userFacing: true,
      $range: { min: 0, max: 500, step: 10, unit: "ms" }
    }),
    normal: t("200ms", "duration", {
      $userFacing: true,
      $range: { min: 0, max: 800, step: 10, unit: "ms" }
    }),
    slow: t("320ms", "duration", {
      $userFacing: true,
      $range: { min: 0, max: 1200, step: 10, unit: "ms" }
    }),
    slower: t("480ms", "duration", {
      $userFacing: true,
      $range: { min: 0, max: 1200, step: 10, unit: "ms" }
    })
  },
  easing: {
    $label: "Easings",
    // General-purpose: a touch of acceleration in, settle out.
    standard: t("cubic-bezier(0.2, 0, 0, 1)", "cubicBezier"),
    // Enter: starts fast, eases to rest, for things appearing.
    decelerate: t("cubic-bezier(0, 0, 0, 1)", "cubicBezier"),
    // Exit: starts at rest, accelerates away, for things leaving.
    accelerate: t("cubic-bezier(0.3, 0, 1, 1)", "cubicBezier"),
    // Expressive enter for larger surfaces (dialog/drawer panels).
    emphasized: t("cubic-bezier(0.05, 0.7, 0.1, 1)", "cubicBezier")
  },
  shadow: {
    $label: "Elevation",
    sm: t("0 1px 2px 0 rgb(0 0 0 / 0.05)", "shadow"),
    md: t("0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", "shadow"),
    lg: t("0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", "shadow")
  },
  focusRing: {
    $label: "Focus ring",
    width: t("2px", "dimension"),
    offset: t("2px", "dimension")
  },
  target: {
    $label: "Target size",
    $description:
      'Minimum interactive hit-target size. AA default 24px (SC 2.5.8); the opt-in AAA conformance mode (data-fluid-conformance="aaa") raises it to 44px (SC 2.5.5). Components read --fluid-target-min and never branch on conformance.',
    min: t("24px", "dimension")
  },
  field: {
    $label: "Fields (inputs, selects, etc.)",
    $description: "Shared dimensions so input, select, color-picker etc. line up visually.",
    height: {
      sm: t("1.75rem", "dimension"),
      md: t("2.25rem", "dimension"),
      lg: t("2.75rem", "dimension")
    },
    paddingX: {
      sm: t("0.5rem", "dimension"),
      md: t("0.75rem", "dimension"),
      lg: t("1rem", "dimension")
    },
    borderWidth: t("1px", "dimension"),
    borderRadius: t("0.5rem", "dimension")
  },
  gradient: {
    $label: "Gradients",
    $description:
      "The Fluid look: subtle vertical glossy sheen layered on top of any solid fill. Apply via background-image; the underlying background-color shines through.",
    glossy: t(
      "linear-gradient(180deg, rgb(255 255 255 / 0.10) 0%, rgb(255 255 255 / 0.02) 35%, transparent 60%, rgb(0 0 0 / 0.04) 100%)",
      "string"
    ),
    "glossy-inverse": t(
      "linear-gradient(180deg, rgb(0 0 0 / 0.06) 0%, rgb(0 0 0 / 0.02) 35%, transparent 60%, rgb(255 255 255 / 0.04) 100%)",
      "string"
    )
  }
} as const satisfies TokenGroup;

/* ────────────────────────────────────────────────────────────────────────── */
/* Semantic tokens, reference primitives. Generated into light.css / dark.css.*/
/* ────────────────────────────────────────────────────────────────────────── */

export const semantics = {
  light: {
    $label: "Light scheme",
    surface: {
      base: t("{color.white}", "color"),
      subtle: t("{color.neutral.50}", "color"),
      muted: t("{color.neutral.100}", "color")
    },
    text: {
      primary: t("{color.neutral.900}", "color"),
      secondary: t("{color.neutral.600}", "color"),
      inverse: t("{color.white}", "color")
    },
    border: {
      default: t("{color.neutral.200}", "color"),
      strong: t("{color.neutral.300}", "color")
    },
    accent: {
      base: t("{color.brand.600}", "color"),
      hover: t("{color.brand.700}", "color"),
      active: t("{color.brand.800}", "color"),
      text: t("{color.white}", "color")
    },
    /*
     * Semantic tones, `tone="..."` on interactive components reaches
     * these. Every base / hover / active step is audited against its text
     * token for WCAG 2.2 SC 1.4.3 AA (4.5:1 for normal text), not just the
     * resting fill: a hovered or pressed control still carries its label.
     * Warning uses dark text because amber-on-white drops below 4.5:1.
     *
     * `scripts/token-contrast.test.mjs` asserts all of it, per brand and
     * scheme, and fails the build on a regression.
     */
    neutral: {
      base: t("{color.neutral.700}", "color"),
      hover: t("{color.neutral.800}", "color"),
      active: t("{color.neutral.900}", "color"),
      text: t("{color.white}", "color")
    },
    success: {
      base: t("{color.emerald.700}", "color"),
      hover: t("{color.emerald.800}", "color"),
      active: t("{color.emerald.900}", "color"),
      text: t("{color.white}", "color")
    },
    danger: {
      base: t("{color.red.600}", "color"),
      hover: t("{color.red.700}", "color"),
      active: t("{color.red.800}", "color"),
      text: t("{color.white}", "color")
    },
    /*
     * Warning is the only light-scheme tone with DARK text, so its ladder
     * runs the opposite way from the others: darkening amber moves the fill
     * TOWARD the label instead of away from it. The old 500/600/700 ladder
     * ended at 3.96:1, under the AA floor, so the states brighten instead.
     */
    warning: {
      base: t("{color.amber.500}", "color"), // neutral.950 on #f59e0b, 9.26:1
      hover: t("{color.amber.400}", "color"), // #fbbf24, 11.92:1
      active: t("{color.amber.300}", "color"), // #fcd34d, 13.80:1
      text: t("{color.neutral.950}", "color")
    },
    // sky.600 leaves white text at 4.10:1, so the whole ladder shifts down one.
    info: {
      base: t("{color.sky.700}", "color"), // white on #0369a1, 5.93:1
      hover: t("{color.sky.800}", "color"), // #075985, 7.56:1
      active: t("{color.sky.900}", "color"), // #0c4a6e, 9.46:1
      text: t("{color.white}", "color")
    },
    focus: {
      ring: {
        color: t("{color.brand.500}", "color")
      }
    }
  },
  dark: {
    $label: "Dark scheme",
    surface: {
      base: t("{color.neutral.950}", "color"),
      subtle: t("{color.neutral.900}", "color"),
      muted: t("{color.neutral.800}", "color")
    },
    text: {
      primary: t("{color.neutral.50}", "color"),
      secondary: t("{color.neutral.400}", "color"),
      inverse: t("{color.neutral.950}", "color")
    },
    border: {
      default: t("{color.neutral.800}", "color"),
      strong: t("{color.neutral.700}", "color")
    },
    accent: {
      base: t("{color.brand.500}", "color"),
      hover: t("{color.brand.400}", "color"),
      active: t("{color.brand.300}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    /*
     * Dark-mode semantic tones. Same pattern as accent: brighter bg
     * + dark text so the button reads from a dark surface. Each base
     * picked to meet 4.5:1 against neutral.950 text.
     */
    neutral: {
      base: t("{color.neutral.300}", "color"),
      hover: t("{color.neutral.200}", "color"),
      active: t("{color.neutral.100}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    success: {
      base: t("{color.emerald.500}", "color"),
      hover: t("{color.emerald.400}", "color"),
      active: t("{color.emerald.300}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    danger: {
      base: t("{color.red.500}", "color"),
      hover: t("{color.red.400}", "color"),
      active: t("{color.red.300}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    warning: {
      base: t("{color.amber.400}", "color"),
      hover: t("{color.amber.300}", "color"),
      active: t("{color.amber.200}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    info: {
      base: t("{color.sky.500}", "color"),
      hover: t("{color.sky.400}", "color"),
      active: t("{color.sky.300}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    focus: {
      ring: {
        color: t("{color.brand.400}", "color")
      }
    }
  }
} as const satisfies { light: TokenGroup; dark: TokenGroup };

/* ────────────────────────────────────────────────────────────────────────── */
/* Conformance deltas. Opt-in AAA text-contrast track (SC 1.4.6).             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Enhanced-contrast (WCAG 2.2 SC 1.4.6, AAA) color deltas.
 *
 * The AA baseline aims at 4.5:1 for normal text; AAA needs 7:1. Only the
 * tokens whose text pair falls under 7:1 are listed here: each moves to the
 * NEAREST step of its own ramp that clears 7:1, so a brand keeps its hue and
 * only deepens (light scheme) or brightens (dark scheme). Every ratio in the
 * comments is the computed WCAG 2 value for the pair named, and is asserted
 * by `scripts/token-contrast.test.mjs`.
 *
 * Interaction states carry text too, so hover/active move with the base. Where
 * the ramp runs out (a light-scheme active step below the 900 stop), the value
 * is mixed toward `neutral.950` rather than inventing an off-ramp hue.
 *
 * The build emits these under `[data-fluid-conformance="aaa"]`, scoped per
 * scheme exactly the way `light.css` / `dark.css` are, and re-declares the
 * union of both schemes' deltas in BOTH blocks so a light value can never
 * leak into a dark subtree (the same exhaustive-redeclaration discipline the
 * main scheme blocks use). Brand presets in `@fluid-ds/themes` re-declare the
 * accent track at their own scope, so each preset ships its own AAA block.
 */
export const conformance = {
  aaa: {
    light: {
      $label: "AAA deltas, light scheme",
      accent: {
        // white on brand.600 is 5.17:1, on brand.700 6.70:1, both under 7.
        base: t("{color.brand.800}", "color"), // white on #1e40af, 8.72:1
        hover: t("{color.brand.900}", "color"), // white on #1e3a8a, 10.36:1
        // One step past the ramp so pressing still reads as a change.
        active: t("color-mix(in srgb, {color.brand.900} 85%, {color.neutral.950})", "color") // #1b3377, 11.75:1
      },
      success: {
        // white on emerald.700 is 5.48:1.
        base: t("{color.emerald.800}", "color"), // white on #065f46, 7.68:1
        hover: t("{color.emerald.900}", "color"), // white on #064e3b, 9.72:1
        active: t("color-mix(in srgb, {color.emerald.900} 85%, {color.neutral.950})", "color") // #064434, 11.15:1
      },
      danger: {
        // white on red.600 is 4.83:1, on red.700 6.47:1.
        base: t("{color.red.800}", "color"), // white on #991b1b, 8.31:1
        hover: t("{color.red.900}", "color"), // white on #7f1d1d, 10.02:1
        active: t("color-mix(in srgb, {color.red.900} 85%, {color.neutral.950})", "color") // #6d1a1a, 11.58:1
      },
      /*
       * Warning carries no AAA delta. Its light ladder already brightens
       * (9.26 / 11.92 / 13.80:1) because dark text forces that direction, and
       * the dark ladder starts brighter still, so every step clears 7:1 at the
       * baseline.
       */
      info: {
        // white on the baseline sky.700 is 5.93:1.
        base: t("{color.sky.800}", "color"), // white on #075985, 7.56:1
        hover: t("{color.sky.900}", "color"), // white on #0c4a6e, 9.46:1
        active: t("color-mix(in srgb, {color.sky.900} 85%, {color.neutral.950})", "color") // #0c405f, 10.97:1
      }
    },
    dark: {
      $label: "AAA deltas, dark scheme",
      text: {
        // neutral.400 reads 7.76:1 on surface-base but only 6.91:1 on
        // surface-subtle and 5.81:1 on surface-muted.
        secondary: t("{color.neutral.300}", "color") // 13.46 / 11.99 / 10.08:1
      },
      accent: {
        // neutral.950 on brand.500 is 5.41:1.
        base: t("{color.brand.400}", "color"), // #09090b on #60a5fa, 7.83:1
        hover: t("{color.brand.300}", "color"), // 11.03:1
        active: t("{color.brand.200}", "color") // 14.00:1
      },
      danger: {
        // neutral.950 on red.500 is 5.29:1.
        base: t("{color.red.400}", "color"), // #09090b on #f87171, 7.19:1
        hover: t("{color.red.300}", "color"), // 10.48:1
        active: t("{color.red.200}", "color") // 13.75:1
      }
    }
  }
} as const satisfies { aaa: { light: TokenGroup; dark: TokenGroup } };

export const isLeaf = (node: unknown): node is TokenLeaf =>
  typeof node === "object" && node !== null && "$value" in node && "$type" in node;
