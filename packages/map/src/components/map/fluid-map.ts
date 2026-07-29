import { LitElement, html, css, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";

// Leaflet ships a UMD bundle as its package "main" with no real ES exports, so
// a bare `import * as L from "leaflet"` resolves to an empty namespace under a
// native ESM loader (web-test-runner, the browser). Import its ESM build, which
// exposes the named exports the `L.` usage below relies on (works in Vite and
// Storybook too). Types come from @types/leaflet via the "paths" shim in
// tsconfig.base.json (the ESM build ships no declarations).
import * as L from "leaflet/dist/leaflet-src.esm.js";

/**
 * Semantic colour for a marker. Drives the pin fill via a tokenised
 * `<fluid-map-pin>` SVG built with `L.divIcon` — falls back to the default
 * Leaflet PNG pin when omitted, so existing call sites stay pixel-identical.
 */
export type FluidMapMarkerTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

/**
 * A fully custom marker icon. Two shapes:
 *
 *  - **image** icon: point `iconUrl` at any image (PNG / SVG / data URI).
 *    `iconAnchor` is the pixel of the image that sits on the coordinate and
 *    defaults to the bottom centre (the classic "pin tip" placement).
 *  - **HTML** icon: pass arbitrary `html` (an emoji, inline SVG, or a styled
 *    element), rendered via Leaflet's `divIcon`. Defaults to a transparent,
 *    centred box anchored at its centre.
 */
export type FluidMapMarkerIcon =
  | {
      /** Image URL for the marker (PNG, SVG, or data URI). */
      iconUrl: string;
      /** Optional retina (2x) image URL. */
      iconRetinaUrl?: string;
      /** Optional drop-shadow image URL. */
      shadowUrl?: string;
      /** Icon size in CSS px `[width, height]`. Defaults to `[25, 41]`. */
      iconSize?: [number, number];
      /** Pixel of the icon placed on the coordinate `[x, y]`. Defaults to the bottom centre. */
      iconAnchor?: [number, number];
      /** Where popups open relative to the anchor `[x, y]`. */
      popupAnchor?: [number, number];
      /** Shadow size in CSS px `[width, height]`. */
      shadowSize?: [number, number];
      html?: never;
    }
  | {
      /** Arbitrary HTML rendered as the marker (emoji, inline SVG, styled element). */
      html: string;
      /** Box size in CSS px `[width, height]`. Defaults to `[30, 30]`. */
      iconSize?: [number, number];
      /** Pixel of the box placed on the coordinate `[x, y]`. Defaults to the centre. */
      iconAnchor?: [number, number];
      /** Where popups open relative to the anchor `[x, y]`. */
      popupAnchor?: [number, number];
      /**
       * Class on the marker wrapper. Defaults to `fluid-map-marker` (transparent,
       * centred). Pass your own to fully restyle; pass `""` for Leaflet's bare div.
       */
      className?: string;
      iconUrl?: never;
    };

/** A single marker placed on the map. */
export interface FluidMapMarker {
  lat: number;
  lng: number;
  label?: string;
  /** Optional semantic tone — renders a coloured Fluid pin instead of the
   *  default Leaflet PNG. Reads tokens (`--fluid-info-base`, etc.) so it
   *  follows the active brand/theme. */
  tone?: FluidMapMarkerTone;
  /**
   * A fully custom icon for this marker: an image (`iconUrl`) or HTML / emoji
   * (`html`). Takes precedence over `tone`. Omit both for the default pin.
   */
  icon?: FluidMapMarkerIcon;
}

/**
 * A themed Leaflet map. Renders an interactive tile map with optional markers,
 * driven by plain properties so it works from any framework.
 *
 * Leaflet needs its global stylesheet and a sized container, neither of which
 * survive inside shadow DOM, so this component renders in LIGHT DOM (it
 * overrides `createRenderRoot` to return itself). Leaflet's stylesheet is
 * auto-loaded once from the CDN at runtime (a `<link>` appended to the document
 * head), so no bundler CSS handling is required. Consumers MUST have `leaflet`
 * installed as a dependency. To self-host the CSS instead, add your own Leaflet
 * stylesheet `<link>` (or one carrying `data-fluid-map-leaflet-css`) to the page
 * before the component upgrades, and this auto-load is skipped.
 *
 * The container is exposed as a labelled `role="region"` so assistive tech can
 * skip into and out of the interactive map. Provide a meaningful `label`.
 *
 * @summary Framework-agnostic Leaflet map wrapper with markers.
 *
 * @csspart base - The map viewport container (the element Leaflet mounts into).
 *
 * @cssproperty --fluid-map-height - Map height. Falls back to 24rem.
 * @cssproperty --fluid-map-radius - Corner radius of the viewport. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-map-border - Border around the viewport. Falls back to 1px solid --fluid-border-default.
 *
 * @uses-token --fluid-radius-md - Viewport corner radius.
 * @uses-token --fluid-border-default - Viewport border color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-accent-base - Focus ring color.
 * @uses-token --fluid-info-base - Info tone pin fill.
 * @uses-token --fluid-success-base - Success tone pin fill.
 * @uses-token --fluid-warning-base - Warning tone pin fill.
 * @uses-token --fluid-danger-base - Danger tone pin fill.
 * @uses-token --fluid-text-secondary - Neutral tone pin fill.
 *
 * @fires fluid-marker-click - A marker was clicked. `detail: { marker }`.
 * @fires fluid-move - The view moved or zoomed. `detail: { center, zoom }`.
 */
export class FluidMap extends LitElement {
  static override styles = css`
    fluid-map {
      display: block;
    }
    fluid-map .viewport {
      width: 100%;
      height: var(--fluid-map-height, 24rem);
      border-radius: var(--fluid-map-radius, var(--fluid-radius-md, 0.5rem));
      border: var(--fluid-map-border, 1px solid var(--fluid-border-default, #e4e4e7));
      overflow: hidden;
    }
    fluid-map .viewport:focus-within {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: 2px;
    }
    /* Tone pins and HTML/emoji markers use divIcon: strip Leaflet's default
       white box so only the glyph/SVG shows, and centre the content. */
    fluid-map .fluid-map-pin,
    fluid-map .fluid-map-marker {
      background: transparent;
      border: 0;
    }
    fluid-map .fluid-map-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      line-height: 1;
    }
  `;

  /** Map center as [latitude, longitude]. */
  @property({ type: Array }) center: [number, number] = [51.505, -0.09];

  /** Initial / current zoom level. */
  @property({ type: Number }) zoom = 13;

  /**
   * Markers to place on the map. Each marker may carry a `label` (popup +
   * tooltip), a semantic `tone` (coloured Fluid pin), or a fully custom `icon`
   * (image or HTML / emoji). `icon` wins over `tone`; omit both for the default
   * Leaflet pin.
   */
  @property({ type: Array }) markers: FluidMapMarker[] = [];

  /** Tile layer URL template. Defaults to OpenStreetMap. */
  @property({ type: String, attribute: "tile-url" }) tileUrl =
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  /** Tile layer attribution (HTML allowed). */
  @property({ type: String }) attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  /** Accessible name for the map region. */
  @property({ type: String }) label = "Map";

  @query(".viewport") private viewport!: HTMLDivElement;

  private map?: L.Map;
  private tileLayer?: L.TileLayer;
  private markerLayer?: L.LayerGroup;

  // Light DOM: Leaflet cannot size or style itself inside a shadow root.
  // Lit only adopts `static styles` into a shadow root, so in light DOM we
  // inject the component CSS once into the document head ourselves.
  protected override createRenderRoot(): HTMLElement {
    FluidMap.injectStyles();
    return this;
  }

  private static stylesInjected = false;
  private static injectStyles(): void {
    if (FluidMap.stylesInjected || typeof document === "undefined") return;
    FluidMap.stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-fluid-map", "");
    style.textContent = FluidMap.styles.toString();
    document.head.appendChild(style);
  }

  // Leaflet's own stylesheet is loaded once from the CDN at runtime. This keeps
  // the published bundle free of a CSS import (which a consumer's bundler would
  // otherwise have to handle) and works in web-test-runner, Vite, and Storybook.
  // Consumers may self-host by adding their own Leaflet `<link>` (or one marked
  // with `data-fluid-map-leaflet-css`) before this component upgrades.
  private static leafletCssLoaded = false;
  private static loadLeafletCss(): void {
    if (FluidMap.leafletCssLoaded || typeof document === "undefined") return;
    FluidMap.leafletCssLoaded = true;
    const existing = document.querySelector(
      'link[data-fluid-map-leaflet-css], link[href*="leaflet"][href$=".css"]'
    );
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-fluid-map-leaflet-css", "");
    document.head.appendChild(link);
  }

  // Leaflet's `Icon.Default` resolves its PNG URLs by detecting where the
  // library's own script/stylesheet lives and prepending that `imagePath`. Under
  // the bundled ESM build that detection is wrong, and it even prepends the
  // detected path to an absolute override, producing a malformed "...disthttps://"
  // URL, so markers render as broken images. We sidestep `Icon.Default` entirely
  // and build one explicit `L.icon` (a plain icon uses its URLs verbatim, with no
  // imagePath prepend) pointing at the CDN PNGs, shared by every marker.
  private static iconInstance?: L.Icon;
  private static markerIcon(): L.Icon {
    if (!FluidMap.iconInstance) {
      const base = "https://unpkg.com/leaflet@1.9.4/dist/images/";
      FluidMap.iconInstance = L.icon({
        iconUrl: `${base}marker-icon.png`,
        iconRetinaUrl: `${base}marker-icon-2x.png`,
        shadowUrl: `${base}marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    }
    return FluidMap.iconInstance;
  }

  // Tone → CSS custom-property name on `<html>` (resolves via the active
  // Fluid theme/brand so the pin re-tints automatically when the theme
  // swaps). `neutral` lands on the text-secondary swatch.
  private static readonly TONE_TOKENS: Record<FluidMapMarkerTone, string> = {
    info: "var(--fluid-info-base, #0284c7)",
    success: "var(--fluid-success-base, #047857)",
    warning: "var(--fluid-warning-base, #f59e0b)",
    danger: "var(--fluid-danger-base, #dc2626)",
    neutral: "var(--fluid-text-secondary, #52525b)"
  };

  private static toneIconCache = new Map<string, L.DivIcon>();
  private static tonedIcon(tone: FluidMapMarkerTone): L.DivIcon {
    const cached = FluidMap.toneIconCache.get(tone);
    if (cached) return cached;
    const fill = FluidMap.TONE_TOKENS[tone];
    // Lucide-style map-pin glyph: outer drop, inner circle. White stroke +
    // soft shadow so the pin reads on any tile.
    const html = `
      <svg viewBox="0 0 24 32" width="28" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id="fmp-shadow" x="-50%" y="-25%" width="200%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="rgba(0,0,0,0.45)"/>
          </filter>
        </defs>
        <path filter="url(#fmp-shadow)"
              d="M12 .8c-5.6 0-10 4.2-10 9.5 0 7 9 19.4 9.4 19.9.3.5 1 .5 1.3 0C13 29.7 22 17.3 22 10.3 22 5 17.6.8 12 .8Z"
              fill="${fill}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="10.5" r="3.6" fill="#fff"/>
      </svg>`;
    const icon = L.divIcon({
      className: `fluid-map-pin fluid-map-pin--${tone}`,
      html,
      iconSize: [28, 36],
      iconAnchor: [14, 35],
      popupAnchor: [0, -30],
      tooltipAnchor: [16, -24]
    });
    FluidMap.toneIconCache.set(tone, icon);
    return icon;
  }

  // Build a fully custom icon from a marker's `icon` spec: an image icon
  // (`L.icon`, used verbatim so there's no imagePath prepend bug) or an HTML /
  // emoji icon (`L.divIcon`). Anchors default to sensible placements: image
  // icons sit by their bottom centre (pin tip), HTML icons by their centre.
  private static buildCustomIcon(spec: FluidMapMarkerIcon): L.Icon | L.DivIcon {
    if ("html" in spec && spec.html !== undefined) {
      const [w, h] = spec.iconSize ?? [30, 30];
      return L.divIcon({
        html: spec.html,
        className: spec.className ?? "fluid-map-marker",
        iconSize: [w, h],
        iconAnchor: spec.iconAnchor ?? [w / 2, h / 2],
        popupAnchor: spec.popupAnchor ?? [0, -h / 2]
      });
    }
    const [w, h] = spec.iconSize ?? [25, 41];
    return L.icon({
      iconUrl: spec.iconUrl,
      iconRetinaUrl: spec.iconRetinaUrl,
      shadowUrl: spec.shadowUrl,
      iconSize: [w, h],
      iconAnchor: spec.iconAnchor ?? [w / 2, h],
      popupAnchor: spec.popupAnchor ?? [0, -h * 0.85],
      shadowSize: spec.shadowSize
    });
  }

  // Choose the icon for a marker: an explicit custom `icon` wins, then a
  // semantic `tone` pin, then the default Leaflet pin.
  private static iconFor(m: FluidMapMarker): L.Icon | L.DivIcon {
    if (m.icon) return FluidMap.buildCustomIcon(m.icon);
    if (m.tone) return FluidMap.tonedIcon(m.tone);
    return FluidMap.markerIcon();
  }

  override firstUpdated(): void {
    FluidMap.loadLeafletCss();
    this.map = L.map(this.viewport, {
      center: this.center,
      zoom: this.zoom
    });

    this.tileLayer = L.tileLayer(this.tileUrl, {
      attribution: this.attribution
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.syncMarkers();

    this.map.on("moveend", () => {
      const c = this.map!.getCenter();
      this.dispatchEvent(
        new CustomEvent("fluid-move", {
          detail: { center: [c.lat, c.lng] as [number, number], zoom: this.map!.getZoom() },
          bubbles: true,
          composed: true
        })
      );
    });

    // Leaflet measures the container on creation; ensure it picks up the
    // settled layout once the element is in the DOM and sized.
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  override updated(changed: Map<string, unknown>): void {
    if (!this.map) return;

    if (changed.has("center") || changed.has("zoom")) {
      this.map.setView(this.center, this.zoom);
    }
    if (changed.has("tileUrl") || changed.has("attribution")) {
      this.tileLayer?.remove();
      this.tileLayer = L.tileLayer(this.tileUrl, { attribution: this.attribution }).addTo(this.map);
    }
    if (changed.has("markers")) {
      this.syncMarkers();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.map?.remove();
    this.map = undefined;
  }

  private syncMarkers(): void {
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();
    for (const m of this.markers) {
      const marker = L.marker([m.lat, m.lng], { icon: FluidMap.iconFor(m) });
      if (m.label) {
        marker.bindPopup(m.label);
        // Reuse the label as the accessible / hover title for the marker.
        marker.bindTooltip(m.label);
      }
      marker.on("click", () => {
        this.dispatchEvent(
          new CustomEvent("fluid-marker-click", {
            detail: { marker: m },
            bubbles: true,
            composed: true
          })
        );
      });
      this.markerLayer.addLayer(marker);
    }
  }

  override render(): TemplateResult {
    return html`<div part="base" class="viewport" role="region" aria-label=${this.label}></div>`;
  }
}
