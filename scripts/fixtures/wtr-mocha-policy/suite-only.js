globalThis.describe.only("Mocha policy focused suite", () => {
  globalThis.it("focused passing browser assertion", () => {
    if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
  });
});
globalThis.it("must not silently disappear from a certified run", () => {
  throw new Error("Intentionally failing sibling excluded by describe.only");
});
