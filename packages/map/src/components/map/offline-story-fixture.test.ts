import { expect, waitUntil } from "@open-wc/testing";
import {
  ensureOfflineMapStyles,
  offlineMapAttribution,
  offlineMapMarkers,
  offlineMapTileUrl,
  withOfflineMapAssets
} from "./offline-story-fixture.js";

describe("offline map story assets", () => {
  it("loads local Leaflet CSS once without replacing an existing fixture link", async () => {
    const selector = "link[data-fluid-map-leaflet-css]";
    expect(document.querySelector(selector)).to.equal(null);
    ensureOfflineMapStyles();
    const link = document.querySelector<HTMLLinkElement>(selector)!;
    try {
      expect(new URL(link.href).origin).to.equal(location.origin);
      expect(new URL(link.href).pathname).to.match(/leaflet\/dist\/leaflet\.css$/);
      expect(link.rel).to.equal("stylesheet");
      await waitUntil(
        () => link.sheet !== null,
        "Locally served Leaflet stylesheet actually loads"
      );
      ensureOfflineMapStyles();
      expect(document.querySelectorAll(selector).length).to.equal(1);
      expect(document.querySelector(selector)).to.equal(link);
    } finally {
      link.remove();
    }
  });

  it("provides distinct named, finite marker locations without image-network dependencies", () => {
    expect(offlineMapMarkers.length).to.equal(2);
    expect(new Set(offlineMapMarkers.map((marker) => marker.label)).size).to.equal(2);
    for (const marker of offlineMapMarkers) {
      expect(marker.label!.length).to.be.greaterThan(0);
      expect(Number.isFinite(marker.lat)).to.equal(true);
      expect(Number.isFinite(marker.lng)).to.equal(true);
      expect(marker).not.to.have.property("iconUrl");
    }
  });

  it("keeps accepted map stories on inline tiles and icons", () => {
    const markers = withOfflineMapAssets([
      { lat: 1, lng: 2, label: "Default" },
      { lat: 3, lng: 4, label: "Tone", tone: "info" },
      { lat: 5, lng: 6, label: "Custom", icon: { html: "X" } }
    ]);
    expect(offlineMapTileUrl.startsWith("data:image/svg+xml,")).to.equal(true);
    expect(offlineMapAttribution).not.to.match(/https?:/);
    expect(markers[0]!.icon?.iconUrl?.startsWith("data:image/svg+xml,")).to.equal(true);
    expect(markers[1]!.tone).to.equal("info");
    expect(markers[1]).not.to.have.property("icon");
    expect(markers[2]!.icon).to.deep.equal({ html: "X" });
  });
});
