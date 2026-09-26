# Storybook fonts

Inter and JetBrains Mono are served locally so browser gates do not depend on
Google Fonts availability. These are the unchanged WOFF2 assets returned by the
previous Google Fonts stylesheet on 2026-08-26: Inter v20 (100 through 900),
JetBrains Mono v24 (400, 500, 600, 700). All original Unicode subsets and font
display settings are preserved. No font dependency is downloaded during builds.

`manifest.json` records the stylesheet, user agent, source URLs and SHA-256
digests. `fonts.css` differs only by using relative local URLs. The two OFL files
retain the respective copyright notices and SIL Open Font License 1.1, obtained
from the [Google Fonts Inter source](https://github.com/google/fonts/tree/main/ofl/inter)
and [JetBrains Mono source](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono).

To update, intentionally retrieve a new stylesheet and its assets, retain the
licenses, update the manifest, and run `test:fonts`, the a11y font test, and visual
regressions. Do not silently update font assets or accept changed baselines.
Arabic is not covered by these fonts and continues to use the configured fallback;
deterministic Arabic typography remains part of the localization/visual work.

Fredoka and Nunito back the Rainbow brand preset (`--fluid-font-family-display`
and `--fluid-font-family-sans` under `data-fluid-brand="rainbow"`). Only the latin
variable-weight subsets are vendored, taken unchanged from the
`@fontsource-variable/fredoka` and `@fontsource-variable/nunito` 5.3.0 npm
packages (sources and digests in `manifest.json`). `Fredoka-OFL.txt` and
`Nunito-OFL.txt` are the SIL Open Font License 1.1 texts shipped in those packages.
No other brand references these families, so the default captures are unaffected.
