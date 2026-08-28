import { expect, fixture } from "@open-wc/testing";
import type { TemplateResult } from "lit";
import meta, {
  CustomMarkers,
  NoMarkers,
  Offline,
  Tall,
  TonedMarkers,
  ZoomedOut
} from "./fluid-map.stories.js";
import type { FluidMap, FluidMapMarker } from "./fluid-map.js";

type StoryRender = () => TemplateResult;

const stories = [
  ["Default", meta.render],
  ["Offline", Offline.render],
  ["NoMarkers", NoMarkers.render],
  ["ZoomedOut", ZoomedOut.render],
  ["Tall", Tall.render],
  ["TonedMarkers", TonedMarkers.render],
  ["CustomMarkers", CustomMarkers.render]
] as const;

const remote = /^https?:/;

function markerUrls(marker: FluidMapMarker): Array<string | undefined> {
  const icon = marker.icon;
  if (!icon || "html" in icon) return [];
  return [icon.iconUrl, icon.iconRetinaUrl, icon.shadowUrl];
}

describe("Map story asset contracts", () => {
  for (const [name, render] of stories) {
    it(`${name} configures only hermetic map assets`, async () => {
      const element = await fixture<FluidMap>((render as StoryRender)());
      expect(element.tileUrl).not.to.match(remote);
      expect(element.attribution).not.to.match(remote);
      expect(
        element.markers
          .flatMap(markerUrls)
          .filter((url): url is string => Boolean(url))
          .some((url) => remote.test(url))
      ).to.equal(false);
      const stylesheet = document.querySelector<HTMLLinkElement>(
        "link[data-fluid-map-leaflet-css]"
      );
      expect(stylesheet).not.to.equal(null);
      expect(new URL(stylesheet!.href).origin).to.equal(location.origin);
    });
  }
});
