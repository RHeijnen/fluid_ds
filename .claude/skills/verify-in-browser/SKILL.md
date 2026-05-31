---
name: verify-in-browser
description: Measure, don't assume, when a UI looks wrong (layout, spacing, sizing, color, alignment, theming, a component not upgrading, docs-vs-Storybook mismatch), inspect the live page with the Chrome DevTools MCP and read the real DOM / computed styles BEFORE proposing a cause or a fix. Invoke for any visual bug, "looks broken" report, or before claiming a fix worked.
---

# Verify in the browser: measure, don't assume

There is a Chrome DevTools MCP connected to this project. Use it. When a UI looks
wrong, the answer is in the live DOM and its computed styles, not in a guess.
This skill exists because guessing wasted a long debugging loop on the button
(repeatedly blaming "browser cache" when the real cause was a slotted `<p>`'s
margin, found in three DevTools probes once we actually looked).

## The rule

**Before you state a cause or claim a fix worked on anything visual, measure the
live page.** "Visual" includes: layout, spacing, alignment, sizing, height/width,
color/contrast, theming, focus rings, a component not upgrading, or any
"it looks different in X than Y" report.

Do NOT:
- Theorize a root cause from the source code alone and present it as the answer.
- Blame cache, "stale build", or "it should work now" without checking.
- Say "this is fixed" after editing CSS without re-measuring the rendered result.

DO:
- Open the actual page, read the actual computed values, find the actual number
  that's wrong, then fix the thing that produces that number.

## The loop

1. **Navigate** to the exact URL (`mcp__chrome-devtools__navigate_page`). For the
   static preview that's `http://localhost:4180/...`; for live component work
   prefer the dev server (Storybook `:6006`, `pnpm docs` Astro dev) which has HMR
   and no stale-artifact risk.
2. **Let it settle.** Web components upgrade via async module scripts. After
   navigate, wait (a short `sleep` in Bash, or poll `customElements.get('fluid-x')`)
   before probing, `upgraded: 0` usually means "too early", not "broken".
3. **Measure** with `mcp__chrome-devtools__evaluate_script`. Read the real thing:
   - `getBoundingClientRect()` for position/size,
   - `getComputedStyle(el)` for the resolved value of the property in question,
   - `el.shadowRoot.querySelector(...)` to reach into shadow DOM,
   - `slot.assignedNodes({flatten:true})` to see what's actually slotted (this is
     how we found the `<p>` wrapper),
   - a `Range` or an inserted probe element to measure a text line box.
   Compare the broken surface against the good one (e.g. docs vs Storybook):
   diff the numbers.
4. **Screenshot** (`take_screenshot`) when the geometry numbers look fine but it
   still "looks wrong", your eyes catch things `getComputedStyle` won't, and it
   confirms what's actually on screen vs what you assume is.
5. **Check the console** (`list_console_messages`, type `error`) for JS errors
   when a component doesn't upgrade or behaves oddly.
6. **Fix the measured cause**, rebuild/HMR, then **re-measure the same number**
   to confirm it changed (e.g. button height 48.8px → 32.8px). A fix isn't done
   until the metric moves.

## Worked example (the button)

Symptom: docs button looked taller/misaligned vs Storybook.
- Probe 1: `getBoundingClientRect().height` → 48.8px in docs, 32.8px in Storybook.
  (Established it's real and quantified, not cache.)
- Probe 2: measured slots → the default slot's assigned node was a `<P>`, not a
  text node. MDX wrapped the label in a paragraph.
- Probe 3: the `<p>` had prose margins → flex item grew to its margin-box.
  Root cause found. Fix: `::slotted(*){margin:0 !important}`. Re-measure: 32.8px.

Three measurements replaced an hour of cache theorising.

## Static-preview gotchas

The `website/` artifact served at `:4180` is a frozen build.

- **Don't hot-swap the served directory.** `rm -rf website/docs && cp ...` while
  the server + browser are live can wedge that browser session (unstyled page,
  components not upgrading) even though the artifact is correct over `curl`.
- **Don't hand-build a sub-app with a leading-slash base env on Windows git-bash.**
  Running `DOCS_BASE=/docs/ pnpm --filter @fluid-ds/docs build` in git-bash makes
  MSYS rewrite `/docs/` into `C:/Program Files/Git/docs/`, so every built asset
  requests from that bogus base and 404s (symptom in the console:
  `:4180/C:/Program%20Files/Git/docs/...`). This actually happened and broke the
  docs styling. **Always rebuild via `pnpm build:website`**, it passes the base
  via Node `spawn` env, which is immune to bash path mangling, never a bash
  `VAR=/x/` prefix.
- **When a preview looks broken:** confirm the served bytes with
  `curl -s URL | grep`, check the built HTML for a mangled `C:/Program` base
  (`grep -c "C:/Program" website/.../index.html`), then do one clean
  `pnpm build:website` and a fresh navigate. For iterating, prefer the dev
  servers (HMR) over the static preview.

## When the browser MCP is genuinely unavailable

Fall back to the next-most-direct evidence, in order: `curl` the served HTML/CSS/JS
and grep for the expected markup/rule; inspect the built artifact on disk; write a
web-test-runner test that asserts the metric (e.g. height < 40px) and run it. Even
then, state it as "verified via X", never "should work".

## One-line creed

If it's visual and you didn't measure it, you don't know it yet.
