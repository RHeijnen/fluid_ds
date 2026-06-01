---
"@fluid-ds/components": patch
---

Add the date component family: `fluid-calendar`, `fluid-date-picker`, and
`fluid-date-range-picker`.

- **`fluid-calendar`**: an accessible month grid built on the WAI-ARIA APG
  date-picker dialog pattern (`role="grid"` with roving-tabindex keyboard
  navigation: arrows, Home/End, PageUp/PageDown, Shift+PageUp/Down). Supports
  single and range selection, min/max bounds, configurable week start, and
  locale-aware day and weekday names.
- **`fluid-date-picker`**: a form-associated single-date field with a popover
  calendar (positioned with floating-ui), ISO `YYYY-MM-DD` values, and
  configurable display format and size.
- **`fluid-date-range-picker`**: a form-associated range field with dual
  calendars, a configurable preset column (Today, Yesterday, Last 7/30 days,
  This/Last month, replaceable or disableable), and hover-preview range
  selection.

All three follow the component-token override ladder
(`--fluid-calendar-*`, `--fluid-date-picker-*`, `--fluid-date-range-picker-*`),
honor `prefers-reduced-motion`, and ship stories, docs, a playground card, and
tests.

Also fixes an AA contrast regression in `fluid-calendar`: adjacent-month day
buttons were dimmed with an extra `opacity`, which blended their text below the
4.5:1 minimum. They now de-emphasize with the muted color alone.
