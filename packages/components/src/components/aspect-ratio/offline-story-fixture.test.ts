import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { offlineLandscapeImage } from "./offline-story-fixture.js";

describe("aspect-ratio offline story image", () => {
  it("decodes a deterministic inline SVG instead of contacting a remote image service", async () => {
    expect(offlineLandscapeImage.startsWith("data:image/svg+xml,")).to.equal(true);
    expect(decodeURIComponent(offlineLandscapeImage)).to.include('width="800" height="300"');
    expect(offlineLandscapeImage).not.to.match(/^https?:/);
    const image = await fixture<HTMLImageElement>(
      html`<img src=${offlineLandscapeImage} alt="" />`
    );
    await waitUntil(() => image.complete && image.naturalWidth === 800);
    expect(image.naturalHeight).to.equal(300);
  });
});
