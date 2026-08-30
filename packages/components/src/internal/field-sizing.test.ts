import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "../components/input/define.js";
import "../components/number-input/define.js";
import "../components/select/define.js";
import "../components/tag-input/define.js";
import "../components/typeahead/define.js";
import "../components/textarea/define.js";
import "../components/date-picker/define.js";
import "../components/time-picker/define.js";
import "../components/date-range-picker/define.js";

/**
 * The shared sizing contract for form fields, enforced across the family rather
 * than one component at a time.
 *
 * A field is almost always placed in a track it does not control: a grid
 * column, a flex item, a `fluid-field` wrapper. It therefore has to take its
 * width from that track and shrink with it. A field that keeps its intrinsic
 * width instead does not merely look wrong, it renders on top of whatever sits
 * beside it and pushes a horizontal scrollbar onto the page.
 *
 * Three separate mistakes produce that same symptom, and each one hides the
 * next, so this checks the observable outcome rather than any single property:
 *
 *  - an inline-level host with no `max-width`, which cannot shrink at all;
 *  - a rem `min-width` floor on the host or the inner input, which blocks
 *    shrinking below its own value;
 *  - a `content-box` inner box, where `width: 100%` still adds the padding and
 *    border on top of the track.
 *
 * All three were live in the date, time and range pickers, which overflowed a
 * two-column row by 8.7px each and collided with their neighbours.
 */
const FIELDS = [
  "fluid-input",
  "fluid-number-input",
  "fluid-select",
  "fluid-tag-input",
  "fluid-typeahead",
  "fluid-textarea",
  "fluid-date-picker",
  "fluid-time-picker",
  "fluid-date-range-picker"
] as const;

describe("form field sizing contract", () => {
  for (const tag of FIELDS) {
    it(`${tag} shrinks with its container instead of overflowing it`, async () => {
      const holder = await fixture<HTMLDivElement>(html`<div style="width: 300px"></div>`);
      const el = document.createElement(tag);
      el.setAttribute("aria-label", "Sizing");
      holder.appendChild(el);
      await elementUpdated(el);
      await aTimeout(20);

      holder.style.width = "140px";
      await aTimeout(20);

      const overflow = Math.round(
        el.getBoundingClientRect().right - holder.getBoundingClientRect().right
      );
      expect(overflow, `${tag} overflows its container by ${overflow}px`).to.be.at.most(1);
    });
  }
});
