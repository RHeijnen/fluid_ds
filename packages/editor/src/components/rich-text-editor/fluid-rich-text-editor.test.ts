import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidRichTextEditor } from "./fluid-rich-text-editor.js";

async function editor(): Promise<FluidRichTextEditor> {
  const el = await fixture<FluidRichTextEditor>(
    html`<fluid-rich-text-editor></fluid-rich-text-editor>`
  );
  await elementUpdated(el);
  await aTimeout(0);
  return el;
}

function editable(el: FluidRichTextEditor): HTMLDivElement {
  return el.shadowRoot!.querySelector<HTMLDivElement>('[part="editable"]')!;
}

describe("<fluid-rich-text-editor>", () => {
  it("emits one change for a real formatting command", async () => {
    const el = await editor();
    el.value = "<p>Hello world</p>";
    const ed = editable(el);
    await selectEditorText(el, 0, "Hello world".length);
    const events: CustomEvent[] = [];
    el.addEventListener("fluid-change", (event) => events.push(event as CustomEvent));
    el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Bold"]')!.click();
    await elementUpdated(el);
    expect(ed.querySelector("b,strong")).to.exist;
    expect(events.length).to.equal(1);
    expect(events[0]!.detail.value).to.equal(el.value);
  });

  it("disables editing and toolbar activation while readonly without emitting changes", async () => {
    const el = await fixture<FluidRichTextEditor>(
      html`<fluid-rich-text-editor readonly .value=${"<p>Read me</p>"}></fluid-rich-text-editor>`
    );
    expect(editable(el).getAttribute("contenteditable")).to.equal("false");
    expect(editable(el).getAttribute("aria-readonly")).to.equal("true");
    const events: Event[] = [];
    el.addEventListener("fluid-change", (event) => events.push(event));
    for (const button of el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")) {
      expect(button.disabled).to.equal(true);
      button.click();
    }
    expect(el.value).to.equal("<p>Read me</p>");
    expect(events).to.deep.equal([]);
    await expect(el).to.be.accessible();
  });

  it("sanitizes pasted HTML and emits the resulting mutation only once", async () => {
    const el = await editor();
    const ed = editable(el);
    // Establish a real browser caret and selected replacement text. Adding a
    // DOM Range into an empty shadow editor does not establish that state in
    // every engine; the paste event below remains an explicit handler unit test.
    ed.focus();
    await sendKeys({ type: "Replace this text" });
    await sendKeys({ press: "Control+A" });
    expect(el.shadowRoot!.activeElement === ed).to.equal(true);
    expect(document.getSelection()?.toString()).to.equal("Replace this text");
    const clipboard = new DataTransfer();
    const pastedHtml = '<p><a href="javascript:alert(1)" onclick="alert(2)">Pasted text</a></p>';
    clipboard.setData("text/html", pastedHtml);
    const events: CustomEvent[] = [];
    el.addEventListener("fluid-change", (event) => events.push(event as CustomEvent));
    const paste = new ClipboardEvent("paste", {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true
    });
    // Firefox does not retain the supplied DataTransfer in a constructed event.
    // Supply the handler's payload explicitly; this is not native clipboard proof.
    Object.defineProperty(paste, "clipboardData", { value: clipboard });
    expect(paste.clipboardData?.getData("text/html")).to.equal(pastedHtml);
    ed.dispatchEvent(paste);
    await elementUpdated(el);
    expect(paste.defaultPrevented).to.equal(true);
    expect(ed.textContent).to.equal("Pasted text");
    expect(ed.querySelector("a")!.hasAttribute("href")).to.equal(false);
    expect(ed.querySelector("a")!.hasAttribute("onclick")).to.equal(false);
    expect(events.length).to.equal(1);
    expect(events[0]!.detail.value).to.equal(el.value);
  });

  it("renders a toolbar with the toolbar role and an orientation", async () => {
    const el = await editor();
    const toolbar = el.shadowRoot!.querySelector('[part="toolbar"]')!;
    expect(toolbar.getAttribute("role")).to.equal("toolbar");
    expect(toolbar.getAttribute("aria-orientation")).to.equal("horizontal");
    expect(toolbar.getAttribute("aria-label")).to.be.a("string").and.not.empty;
  });

  it("exposes the editable region as a multi-line textbox named from label", async () => {
    const el = await fixture<FluidRichTextEditor>(
      html`<fluid-rich-text-editor label="My editor"></fluid-rich-text-editor>`
    );
    await elementUpdated(el);
    const ed = editable(el);
    expect(ed.getAttribute("role")).to.equal("textbox");
    expect(ed.getAttribute("aria-multiline")).to.equal("true");
    expect(ed.getAttribute("aria-label")).to.equal("My editor");
    expect(ed.getAttribute("contenteditable")).to.equal("true");
  });

  it("defaults the accessible name to 'Rich text editor'", async () => {
    const el = await editor();
    expect(editable(el).getAttribute("aria-label")).to.equal("Rich text editor");
  });

  it("uses roving tabindex: exactly one button is tabbable", async () => {
    const el = await editor();
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    const tabbable = [...buttons].filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabbable.length).to.equal(1);
    expect(buttons[0]!.getAttribute("tabindex")).to.equal("0");
  });

  it("moves the active button with ArrowRight / Home / End", async () => {
    const el = await editor();
    const toolbar = el.shadowRoot!.querySelector('[part="toolbar"]')!;
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[1]!.getAttribute("tabindex")).to.equal("0");
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[buttons.length - 1]!.getAttribute("tabindex")).to.equal("0");
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[0]!.getAttribute("tabindex")).to.equal("0");
  });

  it("gives toggle buttons aria-pressed and action buttons none", async () => {
    const el = await editor();
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    // Bold is a toggle.
    expect(buttons[0]!.getAttribute("aria-pressed")).to.equal("false");
    // Clear formatting (last) is an action.
    expect(buttons[buttons.length - 1]!.hasAttribute("aria-pressed")).to.equal(false);
  });

  it("reflects and updates the value property", async () => {
    const el = await editor();
    el.value = "<p>Hello</p>";
    await elementUpdated(el);
    expect(editable(el).innerHTML).to.equal("<p>Hello</p>");
    expect(el.value).to.equal("<p>Hello</p>");
  });

  it("sanitizes programmatically assigned HTML", async () => {
    const el = await editor();
    el.value = '<img src="x" onerror="alert(1)"><script>alert(2)</script>';
    await elementUpdated(el);
    expect(editable(el).querySelector("script")).to.not.exist;
    expect(editable(el).querySelector("img")!.hasAttribute("onerror")).to.be.false;
    expect(el.value).to.not.contain("onerror");
  });

  it("emits fluid-change with the current HTML on input", async () => {
    const el = await editor();
    const ed = editable(el);
    ed.innerHTML = "<p>typed</p>";
    setTimeout(() => ed.dispatchEvent(new Event("input", { bubbles: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect(ev.detail.value).to.equal("<p>typed</p>");
  });

  it("sanitizes edited HTML before emitting it", async () => {
    const el = await editor();
    const ed = editable(el);
    ed.innerHTML = '<a href="javascript:alert(1)" onclick="alert(2)">unsafe</a>';
    setTimeout(() => ed.dispatchEvent(new Event("input", { bubbles: true })));
    const ev = await oneEvent(el, "fluid-change");
    const link = ed.querySelector("a")!;
    expect(link.hasAttribute("href")).to.be.false;
    expect(link.hasAttribute("onclick")).to.be.false;
    expect(ev.detail.value).to.not.contain("javascript:");
  });

  it("shows the placeholder via the data-placeholder attribute while empty", async () => {
    const el = await fixture<FluidRichTextEditor>(
      html`<fluid-rich-text-editor placeholder="Type here"></fluid-rich-text-editor>`
    );
    await elementUpdated(el);
    expect(editable(el).getAttribute("data-placeholder")).to.equal("Type here");
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidRichTextEditor>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-rich-text-editor label="Accessible editor"></fluid-rich-text-editor>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el.querySelector("fluid-rich-text-editor")!).to.be.accessible();
  });
});
function toolbarButtons(el: FluidRichTextEditor): HTMLButtonElement[] {
  return [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]')];
}

function toolbarKey(el: FluidRichTextEditor, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  el.shadowRoot!.querySelector('[part="toolbar"]')!.dispatchEvent(event);
  return event;
}

async function selectEditorText(
  el: FluidRichTextEditor,
  start: number,
  end: number
): Promise<Selection> {
  const ed = editable(el);
  const text = ed.querySelector("p")!.firstChild!;
  expect(text.nodeType).to.equal(Node.TEXT_NODE);
  ed.focus();
  await sendKeys({ press: "Control+Home" });
  for (let index = 0; index < start; index++) await sendKeys({ press: "ArrowRight" });
  for (let index = start; index < end; index++) await sendKeys({ press: "Shift+ArrowRight" });
  const selection = document.getSelection();
  if (!selection) throw new Error("Expected the browser's Selection API");
  expect(el.shadowRoot!.activeElement === ed).to.equal(true);
  expect(selection.toString()).to.equal(text.textContent!.slice(start, end));
  return selection;
}

function observeChanges(el: FluidRichTextEditor): CustomEvent<{ value: string }>[] {
  const changes: CustomEvent<{ value: string }>[] = [];
  el.addEventListener("fluid-change", (event) => {
    if (!(event instanceof CustomEvent)) throw new Error("Expected a fluid-change CustomEvent");
    changes.push(event);
  });
  return changes;
}

describe("<fluid-rich-text-editor> behavioral branch regressions", () => {
  for (const key of ["ArrowLeft", "ArrowUp"]) {
    it(`wraps backward with ${key}, then moves to the preceding toolbar command`, async () => {
      const el = await editor();
      const buttons = toolbarButtons(el);
      buttons[0]!.focus();
      expect(toolbarKey(el, key).defaultPrevented).to.equal(true);
      await elementUpdated(el);
      expect(el.shadowRoot!.activeElement === buttons.at(-1)).to.equal(true);
      expect(buttons.filter((button) => button.tabIndex === 0).length).to.equal(1);
      expect(toolbarKey(el, key).defaultPrevented).to.equal(true);
      await elementUpdated(el);
      expect(el.shadowRoot!.activeElement === buttons.at(-2)).to.equal(true);
      expect(buttons.at(-2)!.tabIndex).to.equal(0);
    });
  }

  for (const key of ["ArrowRight", "ArrowDown"]) {
    it(`wraps forward with ${key} from the final toolbar command`, async () => {
      const el = await editor();
      const buttons = toolbarButtons(el);
      buttons.at(-1)!.focus();
      await elementUpdated(el);
      expect(toolbarKey(el, key).defaultPrevented).to.equal(true);
      await elementUpdated(el);
      expect(el.shadowRoot!.activeElement === buttons[0]).to.equal(true);
      expect(buttons.filter((button) => button.tabIndex === 0).length).to.equal(1);
      expect(buttons[0]!.tabIndex).to.equal(0);
    });
  }

  it("follows the rendered RTL toolbar direction without reordering commands", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="rtl">
        <fluid-rich-text-editor .value=${"<p>Application content</p>"}></fluid-rich-text-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    await elementUpdated(el);
    const buttons = toolbarButtons(el);
    const changes = observeChanges(el);

    expect(getComputedStyle(el).direction).to.equal("rtl");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).to.deep.equal([
      "Bold",
      "Italic",
      "Underline",
      "Bullet list",
      "Numbered list",
      "Link",
      "Clear formatting"
    ]);
    expect(buttons[0]!.getBoundingClientRect().left).to.be.greaterThan(
      buttons[1]!.getBoundingClientRect().left
    );

    buttons[0]!.focus();
    expect(toolbarKey(el, "ArrowLeft").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[1]).to.equal(true);

    expect(toolbarKey(el, "ArrowRight").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[0]).to.equal(true);

    expect(toolbarKey(el, "ArrowRight").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons.at(-1)).to.equal(true);
    expect(el.value).to.equal("<p>Application content</p>");
    expect(changes).to.deep.equal([]);
  });

  it("keeps vertical and endpoint toolbar navigation stable in RTL", async () => {
    const el = await fixture<FluidRichTextEditor>(html`
      <fluid-rich-text-editor dir="rtl"></fluid-rich-text-editor>
    `);
    const buttons = toolbarButtons(el);
    buttons[0]!.focus();

    expect(toolbarKey(el, "ArrowDown").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[1]).to.equal(true);

    expect(toolbarKey(el, "ArrowUp").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[0]).to.equal(true);

    expect(toolbarKey(el, "End").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons.at(-1)).to.equal(true);

    expect(toolbarKey(el, "Home").defaultPrevented).to.equal(true);
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[0]).to.equal(true);
  });

  it("uses the live computed direction for horizontal toolbar navigation", async () => {
    const el = await editor();
    const buttons = toolbarButtons(el);
    const changes = observeChanges(el);
    el.value = "<p>Stable HTML</p>";
    await elementUpdated(el);

    buttons[0]!.focus();
    toolbarKey(el, "ArrowRight");
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[1]).to.equal(true);

    el.dir = "rtl";
    await aTimeout(0);
    expect(getComputedStyle(el).direction).to.equal("rtl");
    toolbarKey(el, "ArrowRight");
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement === buttons[0]).to.equal(true);
    expect(el.value).to.equal("<p>Stable HTML</p>");
    expect(changes).to.deep.equal([]);
  });

  it("leaves unrelated toolbar keys to native handling", async () => {
    const el = await editor();
    const buttons = toolbarButtons(el);
    buttons[1]!.focus();
    await elementUpdated(el);
    for (const key of ["Tab", "Escape", "a"]) {
      expect(toolbarKey(el, key).defaultPrevented).to.equal(false);
      await elementUpdated(el);
      expect(el.shadowRoot!.activeElement === buttons[1]).to.equal(true);
      expect(buttons[1]!.tabIndex).to.equal(0);
    }
  });

  it("rolls back an input mutation while readonly without emitting a change", async () => {
    const el = await editor();
    el.value = "<p>Canonical read-only content</p>";
    el.readOnly = true;
    await elementUpdated(el);
    const changes = observeChanges(el);
    editable(el).innerHTML = "<p>Unexpected mutation</p>";
    editable(el).dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).to.equal("<p>Canonical read-only content</p>");
    expect(editable(el).innerHTML).to.equal(el.value);
    expect(changes.length).to.equal(0);
  });

  it("prevents readonly HTML paste without inserting or emitting", async () => {
    const el = await editor();
    el.value = "<p>Read only</p>";
    el.readOnly = true;
    await elementUpdated(el);
    const changes = observeChanges(el);
    const clipboard = new DataTransfer();
    clipboard.setData("text/html", "<p>Forbidden paste</p>");
    const event = new ClipboardEvent("paste", {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true
    });
    editable(el).dispatchEvent(event);
    expect(event.defaultPrevented).to.equal(true);
    expect(el.value).to.equal("<p>Read only</p>");
    expect(changes.length).to.equal(0);
  });

  it("does not move readonly toolbar state on a dispatched navigation key", async () => {
    const el = await editor();
    el.readOnly = true;
    await elementUpdated(el);
    const buttons = toolbarButtons(el);
    const before = buttons.map((button) => button.tabIndex);
    expect(toolbarKey(el, "ArrowRight").defaultPrevented).to.equal(false);
    await elementUpdated(el);
    expect(buttons.map((button) => button.tabIndex)).to.deep.equal(before);
    expect(buttons.every((button) => button.disabled)).to.equal(true);
  });

  it("blocks a command immediately after readonly is assigned, before disabled markup updates", async () => {
    const el = await editor();
    el.value = "<p>Alpha Beta Gamma</p>";
    await selectEditorText(el, 6, 10);
    const changes = observeChanges(el);
    const bold = toolbarButtons(el)[0]!;
    expect(bold.disabled).to.equal(false);
    el.readOnly = true;
    bold.click();
    await elementUpdated(el);
    expect(bold.disabled).to.equal(true);
    expect(el.value).to.equal("<p>Alpha Beta Gamma</p>");
    expect(editable(el).querySelector("b,strong") === null).to.equal(true);
    expect(changes.length).to.equal(0);
  });

  for (const plainText of [false, true]) {
    it(`delegates paste without HTML to the browser (${plainText ? "plain text" : "missing clipboard"})`, async () => {
      const el = await editor();
      el.value = "<p>Existing content</p>";
      const changes = observeChanges(el);
      const clipboard = plainText ? new DataTransfer() : null;
      clipboard?.setData("text/plain", "Native plain text");
      const event = new ClipboardEvent("paste", {
        clipboardData: clipboard,
        bubbles: true,
        cancelable: true
      });
      editable(el).dispatchEvent(event);
      expect(event.defaultPrevented).to.equal(false);
      // Synthetic paste has no native insertion default action. This assertion
      // proves delegation, not successful operating-system clipboard insertion.
      expect(el.value).to.equal("<p>Existing content</p>");
      expect(changes.length).to.equal(0);
    });
  }

  for (const answer of ["https://example.com/project", null, ""]) {
    it(`handles the link prompt answer ${JSON.stringify(answer)} without duplicate changes`, async () => {
      const el = await editor();
      el.value = "<p>Alpha Beta Gamma</p>";
      await selectEditorText(el, 6, 10);
      const changes = observeChanges(el);
      const originalPrompt = window.prompt;
      const prompts: string[] = [];
      window.prompt = (message?: string): string | null => {
        prompts.push(message ?? "");
        return answer;
      };
      try {
        el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Link"]')!.click();
        await elementUpdated(el);
        expect(prompts).to.deep.equal(["Link URL"]);
        expect(el.shadowRoot!.activeElement === editable(el)).to.equal(true);
        if (answer) {
          const link = editable(el).querySelector("a");
          expect(link !== null).to.equal(true);
          expect(link!.getAttribute("href")).to.equal(answer);
          expect(link!.textContent).to.equal("Beta");
          expect(changes.length).to.equal(1);
          expect(changes[0]!.detail.value).to.equal(el.value);
          expect(changes[0]!.bubbles && changes[0]!.composed).to.equal(true);
        } else {
          expect(el.value).to.equal("<p>Alpha Beta Gamma</p>");
          expect(changes.length).to.equal(0);
        }
      } finally {
        window.prompt = originalPrompt;
      }
    });
  }

  it("captures a real range on pointerdown and restores only that range for formatting", async () => {
    const el = await editor();
    el.value = "<p>Alpha Beta Gamma</p>";
    const selection = await selectEditorText(el, 6, 10);
    const bold = toolbarButtons(el)[0]!;
    const down = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
    bold.dispatchEvent(down);
    expect(down.defaultPrevented).to.equal(true);
    bold.focus();
    selection.removeAllRanges();
    const changes = observeChanges(el);
    bold.click();
    await elementUpdated(el);
    expect(editable(el).querySelector("b,strong")?.textContent).to.equal("Beta");
    expect(editable(el).textContent).to.equal("Alpha Beta Gamma");
    expect(changes.length).to.equal(1);
    expect(changes[0]!.detail.value).to.equal(el.value);
  });

  it("does not restore an obsolete range after a programmatic value replacement", async () => {
    const el = await editor();
    el.value = "<p>Alpha Beta Gamma</p>";
    await selectEditorText(el, 6, 10);
    const bold = toolbarButtons(el)[0]!;
    bold.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    el.value = "<p>Replacement text</p>";
    // Select the replacement synchronously, before the queued selectionchange
    // notification can overwrite an obsolete captured range.
    expect(document.execCommand("selectAll", false)).to.equal(true);
    expect(document.getSelection()?.toString()).to.equal("Replacement text");
    const changes = observeChanges(el);
    bold.click();
    await elementUpdated(el);
    expect(editable(el).textContent).to.equal("Replacement text");
    expect(editable(el).querySelector("b,strong")?.textContent).to.equal("Replacement text");
    expect(changes.length).to.equal(1);
    expect(changes[0]!.detail.value).to.equal(el.value);
  });

  it("keeps a captured range when the assigned value does not replace the DOM", async () => {
    const el = await editor();
    el.value = "<p>Alpha Beta Gamma</p>";
    const selection = await selectEditorText(el, 6, 10);
    const bold = toolbarButtons(el)[0]!;
    bold.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    const unchangedValue = el.value;
    el.value = unchangedValue;
    selection.removeAllRanges();
    const changes = observeChanges(el);
    bold.click();
    await elementUpdated(el);
    expect(editable(el).querySelector("b,strong")?.textContent).to.equal("Beta");
    expect(editable(el).textContent).to.equal("Alpha Beta Gamma");
    expect(changes.length).to.equal(1);
    expect(changes[0]!.detail.value).to.equal(el.value);
  });

  it("restores a native selection inside a consumer's containing shadow root", async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const outer = host.attachShadow({ mode: "open" });
    const el = document.createElement("fluid-rich-text-editor");
    outer.append(el);
    await elementUpdated(el);
    el.value = "<p>Alpha Beta Gamma</p>";
    const selection = await selectEditorText(el, 6, 10);
    const bold = toolbarButtons(el)[0]!;
    bold.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    bold.focus();
    selection.removeAllRanges();
    const changes = observeChanges(el);
    bold.click();
    await elementUpdated(el);
    expect(editable(el).querySelector("b,strong")?.textContent).to.equal("Beta");
    expect(editable(el).textContent).to.equal("Alpha Beta Gamma");
    expect(changes.length).to.equal(1);
    expect(changes[0]!.detail.value).to.equal(el.value);
  });

  it("preserves backward native selection direction when the link prompt is canceled", async () => {
    const el = await editor();
    el.value = "<p>Alpha Beta Gamma</p>";
    const selection = await selectEditorText(el, 10, 10);
    for (let index = 0; index < 4; index++) await sendKeys({ press: "Shift+ArrowLeft" });
    expect(selection.toString()).to.equal("Beta");
    expect(selection.direction).to.equal("backward");
    const link = el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Link"]')!;
    link.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    link.focus();
    selection.removeAllRanges();
    const originalPrompt = window.prompt;
    const changes = observeChanges(el);
    window.prompt = () => null;
    try {
      link.click();
      await elementUpdated(el);
      expect(el.shadowRoot!.activeElement === editable(el)).to.equal(true);
      expect(selection.toString()).to.equal("Beta");
      expect(selection.direction).to.equal("backward");
      await sendKeys({ press: "Shift+ArrowLeft" });
      expect(selection.toString()).to.equal(" Beta");
      expect(el.value).to.equal("<p>Alpha Beta Gamma</p>");
      expect(changes.length).to.equal(0);
    } finally {
      window.prompt = originalPrompt;
    }
  });

  for (const rewrite of ["sanitization", "readonly rollback"]) {
    it(`discards a relocated saved range after ${rewrite} replaces the editable DOM`, async () => {
      const el = await editor();
      el.value = "<p>Alpha Beta Gamma</p>";
      await selectEditorText(el, 6, 10);
      const link = el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Link"]')!;
      link.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      const changes = observeChanges(el);
      if (rewrite === "readonly rollback") el.readOnly = true;
      editable(el)
        .querySelector("p")!
        .insertAdjacentHTML(
          "beforeend",
          '<a href="javascript:alert(1)" onclick="alert(2)"> extra</a>'
        );
      editable(el).dispatchEvent(new Event("input", { bubbles: true }));
      el.readOnly = false;
      const expectedText =
        rewrite === "sanitization" ? "Alpha Beta Gamma extra" : "Alpha Beta Gamma";
      expect(editable(el).textContent).to.equal(expectedText);
      expect(el.value).not.to.contain("javascript:");
      expect(el.value).not.to.contain("onclick");
      expect(changes.length).to.equal(rewrite === "sanitization" ? 1 : 0);
      expect(document.execCommand("selectAll", false)).to.equal(true);
      expect(document.getSelection()?.toString()).to.equal(expectedText);
      const originalPrompt = window.prompt;
      window.prompt = () => null;
      try {
        link.click();
        await elementUpdated(el);
        expect(document.getSelection()?.toString()).to.equal(expectedText);
        expect(changes.length).to.equal(rewrite === "sanitization" ? 1 : 0);
      } finally {
        window.prompt = originalPrompt;
      }
    });
  }

  for (const source of [
    "legacy-contained",
    "legacy-outside",
    "composed-crossing",
    "composed-empty"
  ]) {
    it(`handles the controlled ${source} selection API branch without capturing outside content`, async () => {
      const el = await editor();
      el.value = "<p>Alpha Beta Gamma</p>";
      const outside = await fixture<HTMLParagraphElement>(html`<p>Outside content</p>`);
      const selection = await selectEditorText(el, 6, 10);
      const bold = toolbarButtons(el)[0]!;
      bold.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      // Move focus before the controlled capture: focusout itself captures the
      // actual selection and must not overwrite the branch being asserted.
      bold.focus();
      const text = editable(el).querySelector("p")!.firstChild!;
      const range = document.createRange();
      range.setStart(
        source === "legacy-outside" ? outside.firstChild! : text,
        source === "legacy-outside" ? 0 : 11
      );
      range.setEnd(
        source === "legacy-outside" ? outside.firstChild! : text,
        source === "legacy-outside" ? 7 : 16
      );
      const composedDescriptor = Object.getOwnPropertyDescriptor(selection, "getComposedRanges");
      const rangeDescriptor = Object.getOwnPropertyDescriptor(selection, "getRangeAt");
      const countDescriptor = Object.getOwnPropertyDescriptor(selection, "rangeCount");
      const directionDescriptor = Object.getOwnPropertyDescriptor(selection, "direction");
      const anchorDescriptor = Object.getOwnPropertyDescriptor(selection, "anchorNode");
      const anchorOffsetDescriptor = Object.getOwnPropertyDescriptor(selection, "anchorOffset");
      const originalGetSelection = document.getSelection;
      let controlledReads = 0;
      // These explicit API controls exercise older-browser and rejected-range
      // branches. The nested-shadow test above uses the browser's actual API.
      Object.defineProperty(selection, "getComposedRanges", {
        configurable: true,
        value: source.startsWith("legacy")
          ? undefined
          : () => {
              controlledReads++;
              return source === "composed-empty"
                ? []
                : [
                    new StaticRange({
                      startContainer: text,
                      startOffset: 6,
                      endContainer: outside.firstChild!,
                      endOffset: 7
                    })
                  ];
            }
      });
      Object.defineProperty(selection, "getRangeAt", {
        configurable: true,
        value: () => {
          controlledReads++;
          return range;
        }
      });
      // Focus can clear the native selection in WebKit. This unit branch needs
      // an explicit nonempty API snapshot, not a claim about that native state.
      Object.defineProperty(selection, "rangeCount", { configurable: true, value: 1 });
      if (source === "legacy-contained") {
        Object.defineProperty(selection, "direction", { configurable: true, value: undefined });
        Object.defineProperty(selection, "anchorNode", { configurable: true, value: text });
        Object.defineProperty(selection, "anchorOffset", { configurable: true, value: 16 });
      }
      document.getSelection = () => selection;
      try {
        bold.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      } finally {
        document.getSelection = originalGetSelection;
        if (composedDescriptor)
          Object.defineProperty(selection, "getComposedRanges", composedDescriptor);
        else Reflect.deleteProperty(selection, "getComposedRanges");
        if (rangeDescriptor) Object.defineProperty(selection, "getRangeAt", rangeDescriptor);
        else Reflect.deleteProperty(selection, "getRangeAt");
        if (countDescriptor) Object.defineProperty(selection, "rangeCount", countDescriptor);
        else Reflect.deleteProperty(selection, "rangeCount");
        for (const [key, descriptor] of [
          ["direction", directionDescriptor],
          ["anchorNode", anchorDescriptor],
          ["anchorOffset", anchorOffsetDescriptor]
        ] as const) {
          if (descriptor) Object.defineProperty(selection, key, descriptor);
          else Reflect.deleteProperty(selection, key);
        }
      }
      expect(controlledReads).to.equal(1);
      selection.removeAllRanges();
      const changes = observeChanges(el);
      if (source === "legacy-contained") {
        const originalPrompt = window.prompt;
        window.prompt = () => null;
        try {
          el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Link"]')!.click();
          expect(selection.toString()).to.equal("Gamma");
          expect(selection.direction).to.equal("backward");
          expect(changes.length).to.equal(0);
        } finally {
          window.prompt = originalPrompt;
        }
      }
      bold.click();
      await elementUpdated(el);
      expect(editable(el).querySelector("b,strong")?.textContent).to.equal(
        source === "legacy-contained" ? "Gamma" : "Beta"
      );
      expect(outside.textContent).to.equal("Outside content");
      expect(outside.querySelector("b,strong") === null).to.equal(true);
      expect(changes.length).to.equal(1);
      expect(changes[0]!.detail.value).to.equal(el.value);
    });
  }

  it("keeps other toggle states usable when one native queryCommandState throws", async () => {
    const el = await editor();
    const originalQuery = document.queryCommandState;
    document.queryCommandState = (command: string): boolean => {
      if (command === "bold") throw new Error("Unsupported native command state");
      return command === "italic";
    };
    try {
      editable(el).innerHTML = "<p>Edited text</p>";
      const changes = observeChanges(el);
      editable(el).dispatchEvent(new Event("input", { bubbles: true }));
      await elementUpdated(el);
      expect(toolbarButtons(el)[0]!.getAttribute("aria-pressed")).to.equal("false");
      expect(toolbarButtons(el)[1]!.getAttribute("aria-pressed")).to.equal("true");
      expect(changes.length).to.equal(1);
      expect(changes[0]!.detail.value).to.equal("<p>Edited text</p>");
    } finally {
      document.queryCommandState = originalQuery;
    }
  });

  for (const transition of ["disconnect", "readonly"]) {
    it(`does not steal focus when ${transition} occurs before deferred toolbar focus`, async () => {
      const el = await editor();
      const sentinel = await fixture<HTMLButtonElement>(html`<button>Outside editor</button>`);
      toolbarButtons(el)[0]!.focus();
      toolbarKey(el, "ArrowRight");
      if (transition === "disconnect") el.remove();
      else el.readOnly = true;
      sentinel.focus();
      await elementUpdated(el);
      await Promise.resolve();
      expect(document.activeElement === sentinel).to.equal(true);
      if (transition === "readonly")
        expect(toolbarButtons(el).every((button) => button.disabled)).to.equal(true);
    });
  }

  it("updates inherited Arabic and regional French names live without touching document state", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-rich-text-editor
          placeholder="<Application placeholder>"
          .value=${'<p data-owner="app">Hello &amp; مرحبًا</p>'}
        ></fluid-rich-text-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    await el.updateComplete;
    const initialValue = el.value;
    const changes: Event[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event));
    expect(editable(el).getAttribute("aria-label")).to.equal("محرر نص منسق");
    expect(el.shadowRoot!.querySelector('[part="toolbar"]')!.getAttribute("aria-label")).to.equal(
      "التنسيق"
    );
    expect(toolbarButtons(el)[0]!.getAttribute("aria-label")).to.equal("عريض");
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.dir).to.equal("rtl");

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(editable(el).getAttribute("aria-label")).to.equal("Éditeur de texte enrichi");
    expect(toolbarButtons(el)[0]!.getAttribute("aria-label")).to.equal("Gras");
    expect(editable(el).getAttribute("data-placeholder")).to.equal("<Application placeholder>");
    expect(el.value).to.equal(initialValue);
    expect(changes).to.deep.equal([]);
  });

  it("preserves explicit empty/default-name and placeholder overrides across locale changes", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-rich-text-editor label="" placeholder=""></fluid-rich-text-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    expect(editable(el).getAttribute("aria-label")).to.equal("");
    expect(editable(el).getAttribute("data-placeholder")).to.equal("");
    wrapper.lang = "de";
    await aTimeout(0);
    await el.updateComplete;
    expect(editable(el).getAttribute("aria-label")).to.equal("");
    expect(editable(el).getAttribute("data-placeholder")).to.equal("");
  });

  it("uses the localized link prompt while preserving the entered URL as application data", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-rich-text-editor></fluid-rich-text-editor></div>
    `);
    const el = wrapper.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    el.value = "<p>Link target</p>";
    await el.updateComplete;
    const enteredUrl = "https://example.test/path?q=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7";
    const prompts: string[] = [];
    const commands: unknown[][] = [];
    const originalPrompt = window.prompt;
    const originalExec = document.execCommand;
    window.prompt = (message?: string): string => {
      prompts.push(message ?? "");
      return enteredUrl;
    };
    document.execCommand = (...args: Parameters<typeof document.execCommand>): boolean => {
      commands.push(args);
      return true;
    };
    try {
      el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="رابط"]')!.click();
      expect(prompts).to.deep.equal(["عنوان URL للرابط"]);
      expect(commands[0]).to.deep.equal(["createLink", false, enteredUrl]);
      expect(el.value).to.equal("<p>Link target</p>");
    } finally {
      window.prompt = originalPrompt;
      document.execCommand = originalExec;
    }
  });

  it("follows live Arabic toolbar direction without executing commands or emitting changes", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-rich-text-editor .value=${"<p>Stable</p>"}></fluid-rich-text-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    const changes: Event[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event));
    const toolbar = el.shadowRoot!.querySelector<HTMLElement>('[part="toolbar"]')!;
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await el.updateComplete;
    expect(toolbarButtons(el)[1]!.getAttribute("tabindex")).to.equal("0");
    expect(el.value).to.equal("<p>Stable</p>");
    expect(changes).to.deep.equal([]);
  });
});
