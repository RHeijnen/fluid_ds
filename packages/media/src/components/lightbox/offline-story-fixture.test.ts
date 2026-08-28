import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { offlineLightboxImage } from "./offline-story-fixture.js";

describe("lightbox offline story images", () => {
  it("provides distinct, decodable inline images for every accepted-story item", async () => {
    const images = Array.from({ length: 7 }, (_, index) => offlineLightboxImage(index + 1));
    expect(new Set(images).size).to.equal(7);
    for (const image of images) {
      expect(image.startsWith("data:image/svg+xml,")).to.equal(true);
      expect(decodeURIComponent(image)).to.include('width="200" height="200"');
      expect(image).not.to.match(/^https?:/);
    }
    const elements = await fixture<HTMLDivElement>(
      html`<div>${images.map((image) => html`<img src=${image} alt="" />`)}</div>`
    );
    const rendered = [...elements.querySelectorAll("img")];
    await waitUntil(() => rendered.every((image) => image.complete && image.naturalWidth === 200));
    expect(rendered.every((image) => image.naturalHeight === 200)).to.equal(true);
  });
});
