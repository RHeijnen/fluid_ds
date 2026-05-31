import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import litPlugin from "eslint-plugin-lit";
import litA11yPlugin from "eslint-plugin-lit-a11y";
import wcPlugin from "eslint-plugin-wc";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/storybook-static/**",
      // Unified deploy artifact assembled by `pnpm build:website`.
      "website/**",
      "**/.astro/**",
      // Playwright HTML reports and test results are generated artifacts
      // (trace JS files, vendor bundles, screenshots). They shouldn't be
      // linted, many wouldn't pass strict rules anyway.
      "**/playwright-report/**",
      "**/test-results/**",
      "**/__screenshots__/**",
      "**/playwright/.cache/**",
      // Astro generates these as part of `astro check`; they're machine-
      // emitted and use triple-slash references on purpose. Linting them
      // produces false positives and they aren't shipped.
      "apps/docs/.astro/**",
      // Generated icon manifest, one entry per lucide icon (1500+).
      // Linting it adds zero value and slows the run; the build script
      // emits it deterministically.
      "packages/icons/src/lucide/_manifest.ts",
      "**/custom-elements.json",
      "**/*.config.js",
      "**/*.config.mjs",
      "pnpm-lock.yaml"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/components/src/**/*.ts"],
    plugins: {
      lit: litPlugin,
      "lit-a11y": litA11yPlugin,
      wc: wcPlugin
    },
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      ...litPlugin.configs.recommended.rules,
      ...litA11yPlugin.configs.recommended.rules,
      ...wcPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      // Web components frequently render valid-but-flagged patterns: listbox
      // containers handle click as a mouse fallback (keyboard nav lives on the
      // combobox trigger), and tooltips/popovers derive their accessible name
      // from slotted content the lint plugin can't see. These rules produce
      // too many false positives, disabled at the file level.
      "lit-a11y/click-events-have-key-events": "off",
      "lit-a11y/accessible-name": "off"
    }
  },
  {
    files: ["packages/tokens/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },
  {
    files: ["scripts/**/*.mjs", "**/cem-plugins/**/*.mjs", "apps/*/scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  {
    files: ["**/*.test.ts", "**/*.stories.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off"
    }
  }
];
