---
"@fluid-ds/components": patch
---

Make `fluid-button` submit and reset the nearest light-DOM form when its
`type` is `submit` or `reset`, and avoid false icon-only warnings while slots
are still initializing.
