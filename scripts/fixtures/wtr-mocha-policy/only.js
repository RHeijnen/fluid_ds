globalThis.describe("Mocha policy focused test", () => {
  globalThis.it.only("focused passing browser assertion", () => {
    if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
  });
  globalThis.it("must not silently disappear from a certified run", () => {
    throw new Error("Intentionally failing sibling excluded by it.only");
  });
});
