import { LitElement, html, css, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";

// Leaflet ships a UMD bundle as its package "main" with no real ES exports, so
// a bare `import * as L from "leaflet"` resolves to an empty namespace under a
// native ESM loader (web-test-runner, the browser). Import its ESM build, which
// exposes the named exports the `L.` usage below relies on (works in Vite and
// Storybook too). Types come from @types/leaflet via the "paths" shim in
// tsconfig.base.json (the ESM build ships no declarations).
import * as L from "leaflet/dist/leaflet-src.esm.js";

/** A single marker placed on the map. */
export interface FluidMapMarker {
  lat: number;
  lng: number;
  label?: string;
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
  `;

  /** Map center as [latitude, longitude]. */
  @property({ type: Array }) center: [number, number] = [51.505, -0.09];

  /** Initial / current zoom level. */
  @property({ type: Number }) zoom = 13;

  /** Markers to place on the map. */
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
      const marker = L.marker([m.lat, m.lng], { icon: FluidMap.markerIcon() });
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
