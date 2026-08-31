import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { offlinePortraits } from "./offline-story-fixture.js";

describe("avatar-group offline story portraits", () => {
  it("decode deterministic inline SVGs instead of contacting a remote avatar service", async () => {
    const entries = Object.entries(offlinePortraits);
    expect(entries.map(([name]) => name)).to.deep.equal(["ada", "grace", "alan", "margaret"]);
    for (const [, portrait] of entries) {
      expect(portrait.startsWith("data:image/svg+xml,")).to.equal(true);
      expect(portrait).not.to.match(/^https?:/);
      const image = await fixture<HTMLImageElement>(html`<img src=${portrait} alt="" />`);
      await waitUntil(() => image.complete && image.naturalWidth === 80);
      expect(image.naturalHeight).to.equal(80);
    }
    expect(new Set(entries.map(([, portrait]) => portrait)).size).to.equal(entries.length);
  });
});
