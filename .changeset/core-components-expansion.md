---
"@fluid-ds/components": minor
---

Add 15 new core components (60 → 75), all to the authoring standard (WCAG 2.2
AA, component-scoped tokens, story + docs page + playground card + tests):

- **Navigation + commands**: `fluid-menu` (+ `fluid-menu-item` / `fluid-menu-label`,
  APG menu), `fluid-command-palette` (⌘K modal combobox), `fluid-pagination`,
  `fluid-toolbar` (roving tabindex), `fluid-speed-dial` (FAB menu button).
- **Forms**: `fluid-field` (label + description + error wrapper), `fluid-otp`
  (PIN / one-time-code, form-associated), `fluid-tag-input` (token input,
  form-associated).
- **Content + status**: `fluid-timeline` (+ `fluid-timeline-item`), `fluid-stat`
  (KPI), `fluid-avatar-group`, `fluid-banner`, `fluid-kbd`, `fluid-empty-state`,
  `fluid-pricing-table` (+ `fluid-pricing-tier`).

Also widens the internal `FluidFormAssociated.value` type to allow a string
array (so multi-value controls like the tag input can hold structured values and
serialize to a string for form submission).
