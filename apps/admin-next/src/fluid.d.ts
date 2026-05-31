import "react";

/**
 * Let TSX accept any `<fluid-*>` custom element (see the React app's note).
 * Complex props and custom events go through refs + the element's DOM API.
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
