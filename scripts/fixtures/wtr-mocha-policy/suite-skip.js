globalThis.it("executes a normal browser assertion", () => {
  if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
});
globalThis.describe.skip("Mocha policy pending suite", () => {
  globalThis.it("must not silently omit a declared suite", () => {
    throw new Error("Intentionally failing test excluded by describe.skip");
  });
});
