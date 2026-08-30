import { expect, fixture, html } from "@open-wc/testing";
import { captureFluidFormState } from "./ssr-client.js";
import "./components/input/define.js";
import "./components/checkbox/define.js";
import "./components/masked-input/define.js";
import "./components/number-input/define.js";
import "./components/slider/define.js";
import "./components/switch/define.js";
import "./components/textarea/define.js";
import "./components/typeahead/define.js";
import "./components/color-picker/define.js";
import "./components/date-picker/define.js";
import "./components/date-range-picker/define.js";
import "./components/otp/define.js";
import "./components/tag-input/define.js";
import "./components/time-picker/define.js";
import type { FluidInput } from "./components/input/fluid-input.js";
import type { FluidCheckbox } from "./components/checkbox/fluid-checkbox.js";

describe("captureFluidFormState", () => {
  for (const type of ["checkbox", "number", "email", "date", "range", "color", "file"]) {
    it(`restores a focused native ${type} without invoking unsupported text selection`, async () => {
      const root = await fixture<HTMLDivElement>(
        html`<div><input type=${type} aria-label="Control" /></div>`
      );
      const input = root.querySelector("input")!;
      input.focus();
      const restore = captureFluidFormState(root);
      await restore();
      expect(document.activeElement).to.equal(input);
    });
  }

  it("includes a native control supplied as the capture root", async () => {
    const input = await fixture<HTMLInputElement>(
      html`<input value="before" aria-label="Root control" />`
    );
    const restore = captureFluidFormState(input);
    input.value = "changed";
    await restore();
    expect(input.value).to.equal("before");
  });

  for (const explicitDocument of [false, true]) {
    it(`captures controls from the ${explicitDocument ? "explicit" : "default"} document root`, async () => {
      const input = await fixture<HTMLInputElement>(
        html`<input value="document state" aria-label="Document control" />`
      );
      const restore = explicitDocument ? captureFluidFormState(document) : captureFluidFormState();
      input.value = "changed";
      await restore();
      expect(input.value).to.equal("document state");
    });
  }

  it("captures a document fragment before insertion and restores its original controls after insertion", async () => {
    const root = await fixture<HTMLDivElement>(html`<div></div>`);
    const fragment = document.createDocumentFragment();
    const textarea = document.createElement("textarea");
    textarea.value = "fragment state";
    fragment.append(textarea);
    const restore = captureFluidFormState(fragment);
    root.append(fragment);
    textarea.value = "changed";
    await restore();
    expect(root.firstElementChild).to.equal(textarea);
    expect(textarea.value).to.equal("fragment state");
  });

  it("leaves controls in a still-disconnected fragment untouched", async () => {
    const fragment = document.createDocumentFragment();
    const input = document.createElement("input");
    input.value = "captured";
    fragment.append(input);
    const restore = captureFluidFormState(fragment);
    input.value = "changed while detached";
    await restore();
    expect(input.value).to.equal("changed while detached");
  });

  for (const shadowRootAsRoot of [false, true]) {
    it(`recurses through nested open shadows from a ${shadowRootAsRoot ? "shadow" : "host"} root and restores deep focus`, async () => {
      const outer = await fixture<HTMLDivElement>(html`<div></div>`);
      const outerShadow = outer.attachShadow({ mode: "open" });
      const inner = document.createElement("div");
      outerShadow.append(inner);
      const innerShadow = inner.attachShadow({ mode: "open" });
      const input = document.createElement("input");
      input.value = "nested state";
      innerShadow.append(input);
      input.focus();
      input.setSelectionRange(1, 4, "forward");
      const restore = captureFluidFormState(shadowRootAsRoot ? outerShadow : outer);
      input.value = "changed";
      input.blur();
      await restore();
      expect(input.value).to.equal("nested state");
      expect(document.activeElement).to.equal(outer);
      expect(outerShadow.activeElement).to.equal(inner);
      expect(innerShadow.activeElement).to.equal(input);
      expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).to.deep.equal([
        1,
        4,
        "forward"
      ]);
    });
  }

  it("does not cross an inaccessible closed shadow root", async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const shadow = host.attachShadow({ mode: "closed" });
    const input = document.createElement("input");
    input.value = "captured";
    shadow.append(input);
    const restore = captureFluidFormState(host);
    input.value = "later state";
    await restore();
    expect(input.value).to.equal("later state");
  });

  it("includes a supplied host's shadow controls and reconciles submitted input state without events", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <fluid-input name="note" value="server" required label="Note"></fluid-input>
      </form>`
    );
    const host = form.querySelector<FluidInput>("fluid-input")!;
    const input = host.shadowRoot!.querySelector("input")!;
    input.value = "before hydration";
    const restore = captureFluidFormState(host);
    input.value = "server";
    let changes = 0;
    for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
      host.addEventListener(name, () => changes++);
    }
    await restore();
    expect(host.value).to.equal("before hydration");
    expect(input.value).to.equal(host.value);
    expect(new FormData(form).get("note")).to.equal(host.value);
    expect(changes).to.equal(0);
  });

  it("reconciles checkbox checked and indeterminate state without replacing its configured submission value", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-checkbox name="choice" value="yes" required>Choice</fluid-checkbox></form>`
    );
    const host = form.querySelector<FluidCheckbox>("fluid-checkbox")!;
    const input = host.shadowRoot!.querySelector("input")!;
    input.checked = true;
    input.indeterminate = true;
    const restore = captureFluidFormState(form);
    input.checked = false;
    input.indeterminate = false;
    const changes: string[] = [];
    for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
      host.addEventListener(name, () => changes.push(name));
    }
    await restore();
    expect(host.checked).to.equal(true);
    expect(host.indeterminate).to.equal(true);
    expect(host.value).to.equal("yes");
    expect(new FormData(form).get("choice")).to.equal("yes");
    expect(host.checkValidity()).to.equal(true);
    expect(changes).to.deep.equal([]);
  });

  for (const tag of [
    "fluid-masked-input",
    "fluid-number-input",
    "fluid-slider",
    "fluid-textarea",
    "fluid-typeahead"
  ]) {
    it(`reconciles ${tag} native value, host value and FormData without events`, async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const host = document.createElement(tag) as HTMLElement & {
        name: string;
        value: string;
        updateComplete: Promise<boolean>;
      };
      host.name = "answer";
      host.value = tag === "fluid-slider" ? "20" : "server";
      form.append(host);
      await host.updateComplete;
      const control = host.shadowRoot!.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
      )!;
      const captured =
        tag === "fluid-slider" ? "70" : tag === "fluid-number-input" ? "7" : "before hydration";
      control.value = captured;
      control.focus();
      const restore = captureFluidFormState(form);
      host.value = tag === "fluid-slider" ? "20" : "server";
      await host.updateComplete;
      const events: string[] = [];
      for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
        host.addEventListener(name, () => events.push(name));
      }
      await restore();
      expect(host.value).to.equal(captured);
      expect(control.value).to.equal(captured);
      expect(new FormData(form).get("answer")).to.equal(captured);
      expect(document.activeElement).to.equal(host);
      expect(host.shadowRoot!.activeElement).to.equal(control);
      expect(events).to.deep.equal([]);
    });
  }

  it("reconciles a switch's checked state, validity and FormData without events", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-switch name="answer" value="yes" required>Choice</fluid-switch></form>
    `);
    const host = form.querySelector("fluid-switch") as HTMLElement & {
      checked: boolean;
      updateComplete: Promise<boolean>;
      checkValidity(): boolean;
    };
    const input = host.shadowRoot!.querySelector("input")!;
    input.checked = true;
    const restore = captureFluidFormState(form);
    input.checked = false;
    const events: string[] = [];
    for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
      host.addEventListener(name, () => events.push(name));
    }
    await restore();
    expect(host.checked).to.equal(true);
    expect(input.checked).to.equal(true);
    expect(host.checkValidity()).to.equal(true);
    expect(new FormData(form).get("answer")).to.equal("yes");
    expect(events).to.deep.equal([]);
  });

  for (const fixtureTemplate of [
    html`<form><fluid-date-picker name="answer" value="2026-08-27"></fluid-date-picker></form>`,
    html`<form>
      <fluid-date-range-picker
        name="answer"
        start="2026-08-27"
        end="2026-08-28"
        typeable
      ></fluid-date-range-picker>
    </form>`,
    html`<form><fluid-time-picker name="answer" value="09:30"></fluid-time-picker></form>`
  ]) {
    it("preserves a parsed control's uncommitted display draft without changing canonical form state", async () => {
      const form = await fixture<HTMLFormElement>(fixtureTemplate);
      const host = form.firstElementChild as HTMLElement & {
        updateComplete: Promise<boolean>;
        value: string | null;
      };
      const control = host.shadowRoot!.querySelector("input")!;
      const canonical = host.value;
      const formData = [...new FormData(form)];
      control.value = "unfinished draft";
      control.focus();
      control.setSelectionRange(3, 8, "forward");
      const restore = captureFluidFormState(form);
      control.value = "overwritten";
      const events: string[] = [];
      for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
        host.addEventListener(name, () => events.push(name));
      }
      await restore();
      expect(host.value).to.equal(canonical);
      expect(control.value).to.equal("unfinished draft");
      expect([...new FormData(form)]).to.deep.equal(formData);
      expect(host.shadowRoot!.activeElement).to.equal(control);
      expect([
        control.selectionStart,
        control.selectionEnd,
        control.selectionDirection
      ]).to.deep.equal([3, 8, "forward"]);
      expect(events).to.deep.equal([]);
    });
  }

  it("reconciles a nested color text edit into the parent value and FormData without events", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-color-picker name="color" value="#000000"></fluid-color-picker></form>
    `);
    const host = form.firstElementChild as HTMLElement & {
      updateComplete: Promise<boolean>;
      value: string;
    };
    const nested = host.shadowRoot!.querySelector("fluid-input")!;
    const control = nested.shadowRoot!.querySelector("input")!;
    control.value = "336699";
    const restore = captureFluidFormState(form);
    control.value = "overwritten";
    const events: string[] = [];
    for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
      host.addEventListener(name, () => events.push(name));
    }
    await restore();
    expect(host.value).to.equal("#336699");
    expect(control.value).to.equal("336699");
    expect(new FormData(form).get("color")).to.equal("#336699");
    expect(events).to.deep.equal([]);
  });

  it("combines captured OTP boxes into canonical state without input or completion events", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-otp name="code" length="4"></fluid-otp></form>`
    );
    const host = form.firstElementChild as HTMLElement & {
      updateComplete: Promise<boolean>;
      value: string;
    };
    const controls = [...host.shadowRoot!.querySelectorAll("input")];
    ["1", "2", "3", "4"].forEach((value, index) => {
      controls[index]!.value = value;
    });
    controls[2]!.focus();
    const restore = captureFluidFormState(form);
    controls.forEach((control) => {
      control.value = "";
    });
    const events: string[] = [];
    for (const name of ["input", "change", "fluid-input", "fluid-complete"]) {
      host.addEventListener(name, () => events.push(name));
    }
    await restore();
    expect(host.value).to.equal("1234");
    expect(controls.map(({ value }) => value)).to.deep.equal(["1", "2", "3", "4"]);
    expect(new FormData(form).get("code")).to.equal("1234");
    expect(host.shadowRoot!.activeElement).to.equal(controls[2]);
    expect(events).to.deep.equal([]);
  });

  it("preserves an uncommitted tag draft while leaving committed FormData unchanged", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-tag-input name="tags" value="alpha,beta"></fluid-tag-input></form>
    `);
    const host = form.firstElementChild as HTMLElement & {
      updateComplete: Promise<boolean>;
      value: string[];
    };
    const control = host.shadowRoot!.querySelector("input")!;
    control.value = "uncommitted";
    control.focus();
    const restore = captureFluidFormState(form);
    control.value = "overwritten";
    const events: string[] = [];
    for (const name of ["input", "change", "fluid-input", "fluid-change"]) {
      host.addEventListener(name, () => events.push(name));
    }
    await restore();
    expect(host.value).to.deep.equal(["alpha", "beta"]);
    expect(control.value).to.equal("uncommitted");
    expect(new FormData(form).get("tags")).to.equal("alpha,beta");
    expect(events).to.deep.equal([]);
  });

  it("never assigns a file input's value or invokes its unsupported selection API", async () => {
    const input = await fixture<HTMLInputElement>(
      html`<input type="file" aria-label="Attachment" />`
    );
    input.focus();
    const restore = captureFluidFormState(input);
    Object.defineProperty(input, "value", {
      configurable: true,
      get: () => "",
      set: () => {
        throw new Error("File value must not be assigned");
      }
    });
    input.setSelectionRange = () => {
      throw new Error("File selection API must not be called");
    };
    await restore();
    expect(document.activeElement).to.equal(input);
  });

  it("restores a number value without invoking its unsupported selection API", async () => {
    const input = await fixture<HTMLInputElement>(
      html`<input type="number" value="42" aria-label="Quantity" />`
    );
    input.focus();
    const restore = captureFluidFormState(input);
    input.value = "7";
    input.setSelectionRange = () => {
      throw new Error("Number selection API must not be called");
    };
    await restore();
    expect(input.value).to.equal("42");
    expect(document.activeElement).to.equal(input);
  });

  it("restores native multi-select, textarea, focus and text selection", async () => {
    const root = await fixture<HTMLDivElement>(
      html`<div>
        <select multiple aria-label="Choices">
          <option value="a" selected>A</option>
          <option value="b" selected>B</option>
        </select>
        <textarea aria-label="Text">before hydration</textarea><button>Elsewhere</button>
      </div>`
    );
    const select = root.querySelector("select")!;
    const textarea = root.querySelector("textarea")!;
    textarea.focus();
    textarea.setSelectionRange(2, 6, "backward");
    const restore = captureFluidFormState(root);
    select.value = "b";
    textarea.value = "changed";
    root.querySelector("button")!.focus();
    await restore();
    expect([...select.selectedOptions].map((option) => option.value)).to.deep.equal(["a", "b"]);
    expect(textarea.value).to.equal("before hydration");
    expect(document.activeElement).to.equal(textarea);
    expect([
      textarea.selectionStart,
      textarea.selectionEnd,
      textarea.selectionDirection
    ]).to.deep.equal([2, 6, "backward"]);
  });

  it("does not mutate a replacement node when a captured control was removed", async () => {
    const root = await fixture<HTMLDivElement>(
      html`<div><input value="before" aria-label="Old control" /></div>`
    );
    const input = root.querySelector("input")!;
    const restore = captureFluidFormState(root);
    const replacement = document.createElement("input");
    replacement.value = "replacement";
    input.replaceWith(replacement);
    await restore();
    expect(replacement.value).to.equal("replacement");
  });

  it("does not replay captured state over later edits when restoration is called twice", async () => {
    const input = await fixture<HTMLInputElement>(
      html`<input value="captured" aria-label="Note" />`
    );
    const restore = captureFluidFormState(input);
    await restore();
    input.value = "later edit";
    await restore();
    expect(input.value).to.equal("later edit");
  });

  it("shares one in-flight restoration promise across concurrent callers", async () => {
    const host = await fixture<FluidInput>(
      html`<fluid-input label="Note" value="server"></fluid-input>`
    );
    const input = host.shadowRoot!.querySelector("input")!;
    input.value = "captured";
    const restore = captureFluidFormState(host);
    let release!: (settled: boolean) => void;
    const pending = new Promise<boolean>((resolve) => {
      release = resolve;
    });
    Object.defineProperty(host, "updateComplete", { configurable: true, get: () => pending });
    const first = restore();
    const second = restore();
    expect(second).to.equal(first);
    expect(host.value).to.equal("server");
    Reflect.deleteProperty(host, "updateComplete");
    release(true);
    await Promise.all([first, second]);
    expect(host.value).to.equal("captured");
    host.value = "later edit";
    await host.updateComplete;
    await restore();
    expect(host.value).to.equal("later edit");
  });

  it("awaits false update results until the supported host settles before adopting state", async () => {
    const host = await fixture<FluidInput>(
      html`<fluid-input label="Note" value="server"></fluid-input>`
    );
    host.shadowRoot!.querySelector("input")!.value = "captured";
    const restore = captureFluidFormState(host);
    let reads = 0;
    Object.defineProperty(host, "updateComplete", {
      configurable: true,
      get: () => {
        reads++;
        if (reads <= 2) {
          expect(host.value).to.equal("server");
          return Promise.resolve(false);
        }
        Reflect.deleteProperty(host, "updateComplete");
        return host.updateComplete;
      }
    });
    await restore();
    expect(reads).to.equal(3);
    expect(host.value).to.equal("captured");
    expect(host.shadowRoot!.querySelector("input")!.value).to.equal("captured");
  });

  it("rejects after exactly ten nonsettling host update results without applying captured state", async () => {
    const host = await fixture<FluidInput>(
      html`<fluid-input label="Note" value="server"></fluid-input>`
    );
    host.shadowRoot!.querySelector("input")!.value = "captured";
    const restore = captureFluidFormState(host);
    let reads = 0;
    Object.defineProperty(host, "updateComplete", {
      configurable: true,
      get: () => {
        reads++;
        return Promise.resolve(false);
      }
    });
    const restoration = restore();
    let failure: unknown;
    try {
      await restoration;
    } catch (error) {
      failure = error;
    } finally {
      Reflect.deleteProperty(host, "updateComplete");
    }
    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.equal("Form state updates did not settle: fluid-input");
    expect(reads).to.equal(10);
    expect(host.value).to.equal("server");
    expect(restore()).to.equal(restoration);
  });

  it("refreshes required validity for an empty captured Fluid input", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <fluid-input name="note" value="server" required label="Note"></fluid-input>
      </form>`
    );
    const host = form.querySelector<FluidInput>("fluid-input")!;
    host.shadowRoot!.querySelector("input")!.value = "";
    await captureFluidFormState(form)();
    expect(host.value).to.equal("");
    expect(host.validity.valueMissing).to.equal(true);
    expect(new FormData(form).get("note")).to.equal("");
  });
});
