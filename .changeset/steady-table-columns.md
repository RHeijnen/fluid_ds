---
"@fluid-ds/table": patch
---

Steady the infinite table's columns. Header labels start where their cells
start — the reorder handle overlays the header instead of pushing the label
out of line — and both headers and cells truncate with an ellipsis when a
column is narrowed. A trailing filler column takes the table's spare width,
so a column renders at exactly the width it was given; starting a resize pins
the flexible columns where they stand, so a drag moves one edge only. A
header is dragged by any point of itself, and a pointer reorder rearranges
the columns live as a preview: the drop commits it, a cancelled drag puts the
original order back, and only the drop is reported.
