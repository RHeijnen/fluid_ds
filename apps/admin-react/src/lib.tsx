import { useEffect, useRef } from "react";

/** The Fluid ripples mark (same SVG as the other surfaces). */
export function Logo({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true">
      <defs>
        <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <clipPath id="fluidLogoClip">
          <rect width="96" height="96" rx="22" />
        </clipPath>
      </defs>
      <g clipPath="url(#fluidLogoClip)">
        <rect width="96" height="96" fill="url(#fluidLogoGrad)" />
        <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round">
          <path d="M-6,40 C12,30 26,50 44,40 S72,30 102,40" opacity="0.95" />
          <path d="M-6,58 C12,48 26,68 44,58 S72,48 102,58" opacity="0.65" />
          <path d="M-6,76 C12,66 26,86 44,76 S72,66 102,76" opacity="0.35" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Bind a custom event (e.g. `fluid-change`) on a Fluid element. React's JSX
 * doesn't wire custom events, so we attach via a ref — the standard pattern.
 * Returns a ref to spread onto the element.
 */
export function useFluidEvent<T extends HTMLElement = HTMLElement>(
  event: string,
  handler: (e: CustomEvent) => void
) {
  const ref = useRef<T>(null);
  const saved = useRef(handler);
  saved.current = handler;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = (e: Event) => saved.current(e as CustomEvent);
    el.addEventListener(event, fn);
    return () => el.removeEventListener(event, fn);
  }, [event]);
  return ref;
}

/** Push a toast onto the app's <fluid-toast> stack (imperative method). */
export function toast(message: string, variant = "success") {
  const el = document.getElementById("app-toast") as
    | (HTMLElement & { toast?: (o: { message: string; variant: string; duration: number }) => void })
    | null;
  el?.toast?.({ message, variant, duration: 3500 });
}

type ChartEl = HTMLElement & { data: unknown; options?: unknown };

/**
 * Thin React wrapper for a Fluid chart: complex props (Chart.js `data`/
 * `options`) are objects, so they're assigned as element properties via a ref
 * rather than attributes.
 */
export function FluidChart({
  kind,
  data,
  options,
  height = 260
}: {
  kind: "line" | "doughnut";
  data: unknown;
  options?: unknown;
  height?: number;
}) {
  const ref = useRef<ChartEl>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.data = data;
    if (options) el.options = options;
  }, [data, options]);
  const style = { "--fluid-chart-height": `${height}px` } as React.CSSProperties;
  return kind === "doughnut" ? (
    <fluid-doughnut-chart ref={ref} style={style} />
  ) : (
    <fluid-line-chart ref={ref} style={style} />
  );
}
