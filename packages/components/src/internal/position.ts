/**
 * In-house floating-element positioning, a dependency-free replacement for the
 * subset of `@floating-ui/dom` the overlay components use (`computePosition`,
 * `autoUpdate`, and the `offset` / `flip` / `shift` / `size` / `arrow`
 * middleware). The public API mirrors Floating UI so migrating a component is a
 * near drop-in: swap the import from `@floating-ui/dom` to this module.
 *
 * Scope and intent: this targets top-layer / fixed-positioned overlays
 * (tooltip, popover, dropdown, select, ...) measured against the viewport. It is
 * NOT a full re-implementation of Floating UI (no nested clipping ancestors, no
 * `autoPlacement`, no virtual elements). Each component must be browser-verified
 * when migrated. Until a component imports this, it is inert internal code.
 *
 * Coordinate model: rects are read in viewport space via
 * `getBoundingClientRect`. For `strategy: "fixed"` the returned x/y are viewport
 * coordinates (apply with `position: fixed`). For `strategy: "absolute"` they
 * are relative to the floating element's offset parent.
 */

export type Side = "top" | "right" | "bottom" | "left";
export type Alignment = "start" | "end";
export type Placement = Side | `${Side}-${Alignment}`;
export type Strategy = "absolute" | "fixed";

export interface Coords {
  x: number;
  y: number;
}
export interface Dimensions {
  width: number;
  height: number;
}
export interface Rect extends Coords, Dimensions {}

export interface ElementRects {
  reference: Rect;
  floating: Rect;
}

export interface MiddlewareState extends Coords {
  placement: Placement;
  strategy: Strategy;
  rects: ElementRects;
  elements: { reference: Element; floating: HTMLElement };
  middlewareData: MiddlewareData;
}

export type MiddlewareData = Record<string, Record<string, unknown> | undefined>;

export interface MiddlewareReturn extends Partial<Coords> {
  data?: Record<string, unknown>;
  reset?: boolean | { placement?: Placement };
}

export interface Middleware {
  name: string;
  fn(state: MiddlewareState): MiddlewareReturn;
}

export interface ComputePositionConfig {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Array<Middleware | null | undefined | false>;
}

export interface ComputePositionReturn extends Coords {
  placement: Placement;
  strategy: Strategy;
  middlewareData: MiddlewareData;
}

/* --------------------------------------------------------------------- */
/* Placement helpers                                                     */
/* --------------------------------------------------------------------- */

export function getSide(placement: Placement): Side {
  return placement.split("-")[0] as Side;
}
export function getAlignment(placement: Placement): Alignment | undefined {
  return placement.split("-")[1] as Alignment | undefined;
}
/** The axis the side runs along: top/bottom move on Y, left/right on X. */
function getMainAxis(placement: Placement): "x" | "y" {
  return getSide(placement) === "top" || getSide(placement) === "bottom" ? "y" : "x";
}
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
export function getOppositePlacement(placement: Placement): Placement {
  const align = getAlignment(placement);
  const side = OPPOSITE[getSide(placement)];
  return (align ? `${side}-${align}` : side) as Placement;
}

/** Base coordinates for a placement, before any middleware. */
function computeCoordsFromPlacement(reference: Rect, floating: Dimensions, placement: Placement): Coords {
  const side = getSide(placement);
  const align = getAlignment(placement);
  const refCenterX = reference.x + reference.width / 2;
  const refCenterY = reference.y + reference.height / 2;

  let coords: Coords;
  switch (side) {
    case "top":
      coords = { x: refCenterX - floating.width / 2, y: reference.y - floating.height };
      break;
    case "bottom":
      coords = { x: refCenterX - floating.width / 2, y: reference.y + reference.height };
      break;
    case "left":
      coords = { x: reference.x - floating.width, y: refCenterY - floating.height / 2 };
      break;
    default: // right
      coords = { x: reference.x + reference.width, y: refCenterY - floating.height / 2 };
      break;
  }

  // Alignment shifts along the cross axis (start = align leading edge).
  if (align) {
    if (getMainAxis(placement) === "y") {
      coords.x = align === "start" ? reference.x : reference.x + reference.width - floating.width;
    } else {
      coords.y = align === "start" ? reference.y : reference.y + reference.height - floating.height;
    }
  }
  return coords;
}

/* --------------------------------------------------------------------- */
/* Rect reading                                                          */
/* --------------------------------------------------------------------- */

function getViewportRect(): Rect {
  const doc = document.documentElement;
  return { x: 0, y: 0, width: doc.clientWidth, height: doc.clientHeight };
}

function rectFromDom(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

function getElementRects(reference: Element, floating: HTMLElement, strategy: Strategy): ElementRects {
  const ref = rectFromDom(reference);
  const float: Rect = {
    x: 0,
    y: 0,
    width: floating.offsetWidth || rectFromDom(floating).width,
    height: floating.offsetHeight || rectFromDom(floating).height
  };
  if (strategy === "absolute") {
    const offsetParent = (floating.offsetParent as HTMLElement | null) ?? document.documentElement;
    const op = rectFromDom(offsetParent);
    ref.x -= op.x - offsetParent.scrollLeft;
    ref.y -= op.y - offsetParent.scrollTop;
  }
  return { reference: ref, floating: float };
}

/** Overflow (in px) of the floating rect beyond the viewport on each side;
 *  positive means it spills out by that many px. */
function detectOverflow(state: MiddlewareState, padding = 0): Record<Side, number> {
  const vp = getViewportRect();
  const { x, y } = state;
  const { width, height } = state.rects.floating;
  return {
    top: vp.y + padding - y,
    bottom: y + height - (vp.y + vp.height - padding),
    left: vp.x + padding - x,
    right: x + width - (vp.x + vp.width - padding)
  };
}

/* --------------------------------------------------------------------- */
/* Middleware                                                            */
/* --------------------------------------------------------------------- */

/** Push the floating element away from the reference along the main axis. */
export function offset(value = 0): Middleware {
  return {
    name: "offset",
    fn(state) {
      const side = getSide(state.placement);
      const sign = side === "top" || side === "left" ? -1 : 1;
      return getMainAxis(state.placement) === "y"
        ? { y: state.y + sign * value }
        : { x: state.x + sign * value };
    }
  };
}

/** Flip to the opposite placement when the preferred side overflows. */
export function flip(options: { padding?: number } = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "flip",
    fn(state) {
      if (state.middlewareData.flip?.skip) return {};
      const side = getSide(state.placement);
      const overflow = detectOverflow(state, padding);
      const opposite = getOppositePlacement(state.placement);
      // Flip only if the current side overflows and the opposite side has room.
      if (overflow[side] > 0 && overflow[OPPOSITE[side]] <= 0) {
        return { data: { skip: true }, reset: { placement: opposite } };
      }
      return {};
    }
  };
}

/** Slide along the cross axis so the floating element stays in the viewport. */
export function shift(options: { padding?: number } = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "shift",
    fn(state) {
      const vp = getViewportRect();
      const crossIsX = getMainAxis(state.placement) === "y";
      if (crossIsX) {
        const min = vp.x + padding;
        const max = vp.x + vp.width - padding - state.rects.floating.width;
        return { x: clamp(state.x, min, max) };
      }
      const min = vp.y + padding;
      const max = vp.y + vp.height - padding - state.rects.floating.height;
      return { y: clamp(state.y, min, max) };
    }
  };
}

/** Expose the available width/height (viewport minus padding) to a callback so
 *  the consumer can cap the floating element's size. */
export function size(options: {
  padding?: number;
  apply?: (args: { availableWidth: number; availableHeight: number; rects: ElementRects }) => void;
}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "size",
    fn(state) {
      const vp = getViewportRect();
      const side = getSide(state.placement);
      let availableWidth = vp.width - padding * 2;
      let availableHeight = vp.height - padding * 2;
      if (side === "top") availableHeight = state.rects.reference.y - vp.y - padding;
      else if (side === "bottom")
        availableHeight = vp.y + vp.height - (state.rects.reference.y + state.rects.reference.height) - padding;
      else if (side === "left") availableWidth = state.rects.reference.x - vp.x - padding;
      else availableWidth = vp.x + vp.width - (state.rects.reference.x + state.rects.reference.width) - padding;
      options.apply?.({
        availableWidth: Math.max(0, availableWidth),
        availableHeight: Math.max(0, availableHeight),
        rects: state.rects
      });
      return {};
    }
  };
}

/** Compute the arrow's offset along the cross axis, centered on the reference
 *  and clamped to the floating element so it never points past an edge. */
export function arrow(options: { element: Element | null; padding?: number }): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "arrow",
    fn(state) {
      const el = options.element;
      if (!el) return {};
      const crossIsX = getMainAxis(state.placement) === "y";
      const arrowRect = rectFromDom(el);
      const arrowDim = crossIsX ? arrowRect.width : arrowRect.height;
      const floatDim = crossIsX ? state.rects.floating.width : state.rects.floating.height;
      const refStart = crossIsX ? state.rects.reference.x : state.rects.reference.y;
      const refDim = crossIsX ? state.rects.reference.width : state.rects.reference.height;
      const floatStart = crossIsX ? state.x : state.y;
      // Center of the reference, in floating-local coords.
      const center = refStart + refDim / 2 - floatStart - arrowDim / 2;
      const min = padding;
      const max = floatDim - arrowDim - padding;
      const offsetValue = clamp(center, min, max);
      return { data: { [crossIsX ? "x" : "y"]: offsetValue, centerOffset: center - offsetValue } };
    }
  };
}

function clamp(value: number, min: number, max: number): number {
  // When the element is larger than the room (max < min), prefer the min edge.
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/* --------------------------------------------------------------------- */
/* computePosition + autoUpdate                                          */
/* --------------------------------------------------------------------- */

export async function computePosition(
  reference: Element,
  floating: HTMLElement,
  config: ComputePositionConfig = {}
): Promise<ComputePositionReturn> {
  const placement = config.placement ?? "bottom";
  const strategy = config.strategy ?? "absolute";
  const middleware = (config.middleware ?? []).filter(Boolean) as Middleware[];

  const rects = getElementRects(reference, floating, strategy);
  let statefulPlacement = placement;
  let coords = computeCoordsFromPlacement(rects.reference, rects.floating, statefulPlacement);
  let middlewareData: MiddlewareData = {};

  // Sequential run with reset support (flip restarts from the new placement).
  // The guard bounds restarts so a misbehaving middleware can't loop forever.
  let resets = 0;
  for (let i = 0; i < middleware.length; i += 1) {
    const { name, fn } = middleware[i]!;
    const ret = fn({
      x: coords.x,
      y: coords.y,
      placement: statefulPlacement,
      strategy,
      rects,
      elements: { reference, floating },
      middlewareData
    });
    if (ret.x != null) coords.x = ret.x;
    if (ret.y != null) coords.y = ret.y;
    if (ret.data) middlewareData = { ...middlewareData, [name]: { ...middlewareData[name], ...ret.data } };
    if (ret.reset && resets < middleware.length + 1) {
      resets += 1;
      if (typeof ret.reset === "object" && ret.reset.placement) statefulPlacement = ret.reset.placement;
      coords = computeCoordsFromPlacement(rects.reference, rects.floating, statefulPlacement);
      i = -1;
    }
  }

  return { x: coords.x, y: coords.y, placement: statefulPlacement, strategy, middlewareData };
}

export interface AutoUpdateOptions {
  ancestorScroll?: boolean;
  ancestorResize?: boolean;
  elementResize?: boolean;
}

/**
 * Re-run `update` whenever the reference may have moved: window scroll/resize
 * and (by default) a ResizeObserver on both elements. Returns a cleanup that
 * removes every listener. Mirrors `@floating-ui/dom`'s `autoUpdate`.
 */
export function autoUpdate(
  reference: Element,
  floating: HTMLElement,
  update: () => void,
  options: AutoUpdateOptions = {}
): () => void {
  const { ancestorScroll = true, ancestorResize = true, elementResize = true } = options;
  const win = floating.ownerDocument?.defaultView ?? window;

  const listeners: Array<() => void> = [];
  if (ancestorScroll) {
    win.addEventListener("scroll", update, { passive: true, capture: true });
    listeners.push(() => win.removeEventListener("scroll", update, { capture: true } as EventListenerOptions));
  }
  if (ancestorResize) {
    win.addEventListener("resize", update, { passive: true });
    listeners.push(() => win.removeEventListener("resize", update));
  }
  let ro: ResizeObserver | undefined;
  if (elementResize && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(update);
    ro.observe(reference);
    ro.observe(floating);
    listeners.push(() => ro?.disconnect());
  }

  update();
  return () => {
    for (const off of listeners) off();
  };
}
