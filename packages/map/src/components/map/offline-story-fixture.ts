import type { FluidMapMarker } from "./fluid-map.js";

const svgDataUrl = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** A seamless, deterministic tile used only by Storybook examples and visual tests. */
export const offlineMapTileUrl =
  svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#eef2e8"/>
  <path d="M-20 196 276 44" stroke="#bad9e8" stroke-width="42"/>
  <path d="M-20 196 276 44" stroke="#d9f0f7" stroke-width="32"/>
  <g fill="none" stroke="#fff" stroke-width="12">
    <path d="M-12 58 268 164"/><path d="M42 -12 184 268"/><path d="M-12 232 232 -12"/>
  </g>
  <g fill="none" stroke="#d8d2c5" stroke-width="3">
    <path d="M-12 58 268 164"/><path d="M42 -12 184 268"/><path d="M-12 232 232 -12"/>
    <path d="M0 108h256M0 214h256M82 0v256M218 0v256"/>
  </g>
  <g fill="#d7e7ca"><rect x="12" y="12" width="54" height="34" rx="5"/><rect x="174" y="184" width="64" height="54" rx="6"/></g>
</svg>`);

export const offlineMapAttribution = "Deterministic local story map";

const offlineDefaultMarker = {
  iconUrl:
    svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path d="M12.5 1C6.15 1 1 6.15 1 12.5 1 21.1 12.5 40 12.5 40S24 21.1 24 12.5C24 6.15 18.85 1 12.5 1Z" fill="#2a81cb" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
  </svg>`),
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number]
};

/** Keep each story's marker semantics while replacing only CDN-backed default icon assets. */
export function withOfflineMapAssets(markers: FluidMapMarker[]): FluidMapMarker[] {
  return markers.map((marker) =>
    marker.icon || marker.tone ? marker : { ...marker, icon: offlineDefaultMarker }
  );
}

/** Storybook-only assets: real, locally served Leaflet CSS and inline SVG pins. */
export function ensureOfflineMapStyles(): void {
  if (document.querySelector("link[data-fluid-map-leaflet-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../../../node_modules/leaflet/dist/leaflet.css", import.meta.url).href;
  link.setAttribute("data-fluid-map-leaflet-css", "");
  document.head.append(link);
}

export const offlineMapMarkers: FluidMapMarker[] = [
  { lat: 51.505, lng: -0.09, label: "Depot", tone: "info" },
  { lat: 51.51, lng: -0.1, label: "Warehouse", tone: "success" }
];
