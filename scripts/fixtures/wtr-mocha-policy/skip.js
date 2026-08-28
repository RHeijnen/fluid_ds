globalThis.it("executes a normal browser assertion", () => {
  if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
});
globalThis.it.skip("must not silently omit a declared test", () => {
  throw new Error("Intentionally failing test excluded by it.skip");
});
