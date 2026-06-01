---
"@fluid-ds/components": patch
---

Fix `fluid-date-picker` and `fluid-date-range-picker` popovers being clipped /
invisible inside constrained containers (Storybook preview frames, transformed
or `overflow`-hidden ancestors). Both panels now render in the **top layer** via
the native Popover API (`popover="manual"` + `showPopover()` / `hidePopover()`,
`:popover-open` + `@starting-style` for the fade), matching the approach already
used by `fluid-dropdown`. floating-ui still drives placement; a plain
`position: fixed` panel could be trapped by a transformed containing block.
