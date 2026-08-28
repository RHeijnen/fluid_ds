# Fluid React

Generated React 19 wrappers for every published Fluid custom element. Import a
single wrapper from a component subpath to keep the integration tree-shakable.

```tsx
import { FluidButton } from "@fluid-ds/react/button";

export function SaveButton() {
  return <FluidButton variant="primary">Save</FluidButton>;
}
```

The wrappers and raw JSX declarations are regenerated from Fluid's component
inventory. Do not edit files under `src/generated` by hand.
