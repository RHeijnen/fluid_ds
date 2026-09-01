---
"@fluid-ds/animations": major
---

Add an opt-in `space: "document"` coordinate system to every canvas effect so
particles can remain anchored to page content while scrolling. The shared
canvas stays viewport-sized, and `<fluid-celebrate>` exposes the same option via
its `space` attribute.
