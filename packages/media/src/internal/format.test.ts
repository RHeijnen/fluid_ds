import { expect } from "@open-wc/testing";
import { formatMediaNumber } from "./format.js";

describe("formatMediaNumber", () => {
  it("formats media digits without grouping and pads to the requested width", () => {
    expect(formatMediaNumber(1234, "en")).to.equal("1234");
    expect(formatMediaNumber(7, "en", 2)).to.equal("07");
    expect(formatMediaNumber(5, "ar")).to.equal(
      new Intl.NumberFormat("ar", { useGrouping: false }).format(5)
    );
  });

  it("keeps a time display readable when the document language is not a usable locale", () => {
    // HTML accepts any `lang` value, while Intl rejects malformed tags outright.
    expect(() => new Intl.NumberFormat("en_US")).to.throw(RangeError);
    expect(formatMediaNumber(5, "en_US", 2)).to.equal("05");
    expect(formatMediaNumber(12, "en_US")).to.equal("12");
  });

  it("does not swallow failures that are not an unusable locale", () => {
    // A missing locale is a caller bug rather than a browser quirk, so the
    // English fallback must not hide it.
    const missing = null as unknown as string;
    expect(() => new Intl.NumberFormat(missing)).to.throw(TypeError);
    expect(() => formatMediaNumber(1, missing)).to.throw(TypeError);
  });
});
