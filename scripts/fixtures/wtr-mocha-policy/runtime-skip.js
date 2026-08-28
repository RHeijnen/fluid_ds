globalThis.it("executes a normal browser assertion", () => {
  if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
});
globalThis.it("must not silently skip after test execution begins", function () {
  this.skip();
  throw new Error("Intentionally failing test excluded by runtime skip");
});
