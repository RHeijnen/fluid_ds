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
      "Minimum interactive hit-target size. AA default 24px (SC 2.5.8); the opt-in AAA conformance mode (data-fluid-conformance=\"aaa\") raises it to 44px (SC 2.5.5). Components read --fluid-target-min and never branch on conformance.",
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
     * these. Each base+text pair audited to meet WCAG 2.1 SC 1.4.3 AA
     * (4.5:1 contrast minimum) for normal text. Warning uses dark text
     * because amber-on-white drops below 4.5:1.
     *
     * See `.claude/skills/accessibility/references/tokens.md` for the
     * contrast-validator script outline that should fail the build on
     * any regression here.
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
    warning: {
      base: t("{color.amber.500}", "color"),
      hover: t("{color.amber.600}", "color"),
      active: t("{color.amber.700}", "color"),
      text: t("{color.neutral.950}", "color")
    },
    info: {
      base: t("{color.sky.600}", "color"),
      hover: t("{color.sky.700}", "color"),
      active: t("{color.sky.800}", "color"),
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

export const isLeaf = (node: unknown): node is TokenLeaf =>
  typeof node === "object" && node !== null && "$value" in node && "$type" in node;
