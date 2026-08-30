# Fluid component-review handoff

This is the continuation guide for the owner-led Storybook review that started
after the 0.4.0 production-hardening work. The canonical checklist is
[`reviews/component-visual-audit-0.4.0.md`](reviews/component-visual-audit-0.4.0.md).

## Exact continuation point

- Product commit: `d2d0ee8e4e8a321d4059f9929d5bc96931037343`
  (`0.4 hardening`).
- At the start of this documentation update, `main` and `origin/main` pointed to
  that commit and the worktree was clean.
- Owner-approved: **28 of 155** public custom elements (**18.1%**).
- Pending owner review: **127 of 155** (**81.9%**).
- The reviewed block is #001 through #028: all initial form controls and form
  primitives from `fluid-input` through `fluid-form`.
- Resume at **#029 `fluid-avatar`** using
  [Components/Content/Avatar: Initials](http://127.0.0.1:6006/?path=/story/components-content-avatar--initials).
- Do not mark a row Approved based only on automated checks. Approval records the
  owner's explicit visual acceptance.

## Review workflow

For each remaining row, in order:

1. Read the component source, stories, tests and its row in the canonical ledger.
2. Check that component-scoped CSS custom properties exist for the visual values
   users reasonably need to isolate. They should fall back to shared design
   tokens; do not replace the shared system with disconnected hard-coded values.
3. Check every visible Storybook control. Changing an arg must change the
   rendered component. Disable controls that cannot honestly apply to a
   multi-fixture story.
4. Check the useful state matrix: default, disabled, readonly where applicable,
   validation/error, description/help content, icons or text affixes, sizes,
   light/dark, focus, keyboard behavior, constrained width and RTL/localization
   where applicable. Add form examples only for actual form-associated controls.
5. Build or run Storybook and open the exact story in the **Chrome DevTools MCP**
   for the owner. Do not silently substitute the Codex in-app browser when the
   owner asks for DevTools MCP.
6. Let the owner inspect it. If the owner reports a defect, keep that row in
   review, implement the smallest systemic fix, add or update regression tests,
   and present the repaired story again.
7. When the owner says `ok`, change only that row to `Approved` and move directly
   to the next numbered row.

Useful commands:

```powershell
corepack pnpm@9.15.0 storybook
corepack pnpm@9.15.0 --filter @fluid-ds/components test
corepack pnpm@9.15.0 typecheck
```

The all-engine release gate is:

```powershell
$env:FLUID_BROWSERS = "all"
corepack pnpm@9.15.0 verify
```

Use the established Linux verification container for authoritative long runs if
the Windows dependency tree or WebKit teardown is unreliable. Confirm that its
Git commit and source tree match the host before crediting a result.

## Standards established during the forms review

Preserve these decisions unless the owner explicitly changes them:

- Standard single-line form controls target a 38px visual height. Buttons use a
  deliberate 32px height and are vertically centered with fields; a button is
  not a failed 38px input.
- Height fixes belong on the actual control and its visible adornments. Do not
  manufacture parity with invisible wrappers or click-blocking containers.
- Labels and optional descriptions sit above the control. Help text and errors
  sit below it. The required asterisk is sufficient by default; a literal
  `Required` description is optional and off by default.
- Form stories use `fluid-button`, not an unstyled native submit button.
- Input-family typography inherits the shared typography tokens and exposes
  component-specific fallback hooks. Masked and segmented/OTP inputs do not use
  a different font by default merely because their content is structured.
- Prefix and suffix support should cover meaningful icon and text examples.
  Adornment borders and corner radii must join cleanly at every edge.
- Native number-input chevrons and Fluid `-`/`+` steppers are separate valid
  variants. Neither variant may increase the standard field height.
- Textarea counters sit below the editable box so they cannot cover content or
  obstruct the native resize handle.
- Active/selected styles reserve their border geometry in the inactive state so
  toggling a radio or similar control never shifts adjacent text.
- Date and time picker popovers can optionally open when the field itself is
  clicked. Time-picker interval choices should remain configurable.
- Color-picker recoloring is opt-in. Palette size/content is configurable, and
  palette/form stories must not change the control height.
- Form-oriented file/dropzone variants should use the regular field focus,
  border and sizing language while retaining an appropriate drop target.

## What remains after the form block

The pending queue is already fully ordered in the canonical ledger:

- #029–050: content
- #051–067: feedback
- #068–069: remaining specialized form controls
- #070–087: layout
- #088–114: navigation
- #115–124: utilities
- #125–155: animations, calendar, charts, editor, kanban, map, markdown, media,
  node graph, parser, QR, scheduler and tables

Some rows are companion elements rendered in a parent's story (for example an
item plus its containing group). Review the companion in that context, but keep
both ledger rows explicit and record the owner's decision for each.

## Verification and release boundary

The `0.4 hardening` product tree passed the full local pinned-Linux verification
before push. The first GitHub Node 24 `verify` lane nevertheless failed in the
matrix runner's Corepack bootstrap guard before component tests started. A
targeted uncommitted correction uses the workflow-installed exact pnpm and
passes its 11/11 native-runner guards on Windows and Linux; GitHub confirmation
is still required. This does not change the product-suite results, and it does
not mean the remaining 127 components have owner visual approval. Automated
accessibility, interaction, SSR, packaging and coverage evidence are summarized separately in
[`verification-and-test-inventory-0.4.0.md`](verification-and-test-inventory-0.4.0.md).

Do not push, publish, deploy, tag, accept visual baselines or make a maturity
promotion unless the owner explicitly asks. Documentation edits made after the
product push are new work and should be committed separately or included in the
next owner-directed squash.
