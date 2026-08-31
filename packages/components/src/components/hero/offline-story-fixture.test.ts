import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { offlineGradientArtwork } from "./offline-story-fixture.js";

describe("hero offline story artwork", () => {
  it("decodes a deterministic inline SVG instead of contacting a remote image service", async () => {
    expect(offlineGradientArtwork.startsWith("data:image/svg+xml,")).to.equal(true);
    expect(decodeURIComponent(offlineGradientArtwork)).to.include('width="900" height="675"');
    expect(offlineGradientArtwork).not.to.match(/^https?:/);
    const image = await fixture<HTMLImageElement>(
      html`<img src=${offlineGradientArtwork} alt="" />`
    );
    await waitUntil(() => image.complete && image.naturalWidth === 900);
    expect(image.naturalHeight).to.equal(675);
  });
});
