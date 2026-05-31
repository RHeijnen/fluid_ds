import "react";

/**
 * Let TSX accept any `<fluid-*>` custom element. With @types/react 19 the JSX
 * namespace lives on the `react` module, so we augment it there. Standard HTML
 * attributes (className, style, slot, ref, children) are typed; component props
 * (variant, value, checked, label, …) come through the index signature. Complex
 * props (a chart's `.data`) and custom events (`fluid-change`) go through a ref
 * + the element's DOM API (see useFluidEvent / the chart wiring).
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `fluid-${string}`]: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Record<string, unknown>;
    }
  }
}
