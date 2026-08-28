globalThis.describe("Mocha policy normal browser suite", () => {
  globalThis.it("executes an actual browser DOM assertion", () => {
    const button = globalThis.document.createElement("button");
    button.textContent = "Policy fixture";
    if (button.textContent !== "Policy fixture") throw new Error("Browser assertion failed");
  });
  globalThis.it("executes the second declared test", () => {
    if (globalThis.document.nodeType !== 9) throw new Error("Expected a browser document");
  });
});
