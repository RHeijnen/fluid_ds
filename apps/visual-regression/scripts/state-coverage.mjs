import { inventory, readGeneratedCatalog } from "./baseline-inventory.mjs";

export const stateFixtures = {
  open: ["components-navigation-speed-dial--open", "components-feedback-tour--open-on-load"],
  invalid: [
    "components-forms-input--states",
    "components-forms-masked-input--states",
    "components-forms-textarea--states",
    "components-forms-field--with-error",
    "components-forms-fieldset--with-error"
  ]
};

export async function stateCoverage() {
  const catalog = await readGeneratedCatalog();
  const gap = await inventory();
  const catalogIds = new Set(catalog.map(({ id }) => id));
  const missingNames = new Set(gap.missing.map(({ name }) => name));
  const result = Object.fromEntries(
    Object.entries(stateFixtures).map(([state, fixtureIds]) => [
      state,
      fixtureIds.map((fixtureId) => ({
        fixtureId,
        present: catalogIds.has(fixtureId),
        acceptedLightBaseline: !missingNames.has(`${fixtureId}-light.png`)
      }))
    ])
  );
  return {
    ...result,
    focus: {
      fixtureId: "components-forms-button--keyboard-focus",
      automatedStaticFixture: catalogIds.has("components-forms-button--keyboard-focus"),
      acceptedLightBaseline: !missingNames.has("components-forms-button--keyboard-focus-light.png"),
      disposition:
        "The attributed fixture uses a real Tab key and verifies the shadow target and :focus-visible; its candidate images remain unaccepted pending human review."
    }
  };
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  const result = await stateCoverage();
  console.log(JSON.stringify(result, null, 2));
  const supported = [...result.open, ...result.invalid];
  if (supported.some(({ present, acceptedLightBaseline }) => !present || !acceptedLightBaseline)) {
    process.exitCode = 1;
  }
}
