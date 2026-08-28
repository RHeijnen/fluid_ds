import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidToast } from "./fluid-toast.js";
import type { FluidToastItem } from "./fluid-toast-item.js";

describe("<fluid-toast> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () => fixture<HTMLDivElement>('<div lang="en"><fluid-toast></fluid-toast></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Meldingen"],
    ["de", "Benachrichtigungen"],
    ["fr", "Notifications"],
    ["es", "Notificaciones"],
    ["ar", "الإشعارات"],
    ["fr-CA", "Notifications"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Notifications");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Meldingen");
    });
  }

  for (const explicit of ["", "Notifications", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-toast") as NamedControl;
      control.setAttribute("aria-label", explicit);
      const wrapper = await fixture<HTMLDivElement>('<div lang="nl"></div>');
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      wrapper.lang = "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.remove();
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.removeAttribute("aria-label");
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Notifications");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Notifications", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Notifications" : "Meldingen"
    );
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Notifications", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Notifications" : "Meldingen"
    );
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-toast-label";
    label.textContent = "Application heading";
    wrapper.append(label);
    control.setAttribute("aria-labelledby", label.id);
    await settle(control);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-labelledby")).to.equal(label.id);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Notifications");
  });

  it("never removes an authored aria-label when aria-labelledby is added or removed", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    control.setAttribute("aria-label", "Author fallback");
    control.setAttribute("aria-labelledby", "application-external-label");
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
  });

  it("retains ownership after detached edits and follows a closed-shadow locale context", async () => {
    const wrapper = await fixture<HTMLDivElement>('<div lang="en"></div>');
    const context = document.createElement("div");
    const root = context.attachShadow({ mode: "closed" });
    const control = document.createElement("fluid-toast") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Notifications");
    control.remove();
    control.setAttribute("aria-label", "Notifications");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Notifications");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Meldingen");
  });
});

describe("<fluid-toast>", () => {
  it("updates only the region name without replacing toast items, content or focus", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast lang="en"></fluid-toast>`);
    const message = document.createElement("button");
    message.textContent = "Application action";
    const item = el.toast({ message, duration: 0 });
    await item.updateComplete;
    message.focus();
    el.lang = "nl";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Meldingen");
    expect(el.firstElementChild === item).to.equal(true);
    expect(item.contains(message)).to.equal(true);
    expect(message.textContent).to.equal("Application action");
    expect(document.activeElement === message).to.equal(true);
    item.dismiss();
    await aTimeout(250);
    expect(el.querySelector("fluid-toast-item")).to.equal(null);
  });

  it("passes a11y audits when empty and with a live toast", async () => {
    const el = await fixture<FluidToast>(
      html`<fluid-toast aria-label="Notifications"></fluid-toast>`
    );
    await expect(el).to.be.accessible();
    el.toast({ message: "Profile saved", duration: 0 });
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("renders as a region", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    expect(el.getAttribute("role")).to.equal("region");
  });

  it("toast() appends an item", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "Hi", duration: 0 });
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(1);
  });

  it("auto-dismisses after duration", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    const item = el.toast({ message: "bye", duration: 10 });
    await oneEvent(item, "fluid-dismiss");
    await aTimeout(10);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(0);
  });

  it("sticky toasts don't auto-dismiss", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "sticky", duration: 0 });
    await aTimeout(60);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(1);
  });

  it("clear() dismisses all toasts", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "a", duration: 0 });
    el.toast({ message: "b", duration: 0 });
    el.clear();
    await aTimeout(250);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(0);
  });

  it("does not emit a late dismiss after an externally managed timed item is removed", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    const item = document.createElement("fluid-toast-item") as FluidToastItem;
    item.duration = 20;
    let dismisses = 0;
    item.addEventListener("fluid-dismiss", () => dismisses++);
    el.append(item);
    await item.updateComplete;

    item.remove();
    await aTimeout(240);

    expect(dismisses).to.equal(0);
    expect(item.hasAttribute("dismissing")).to.equal(false);
  });

  it("preserves focused toast content while siblings are inserted and removed", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    const focusedItem = document.createElement("fluid-toast-item") as FluidToastItem;
    focusedItem.duration = 0;
    const action = document.createElement("button");
    action.textContent = "Undo";
    focusedItem.append(action);
    el.append(focusedItem);
    await focusedItem.updateComplete;
    action.focus();

    const sibling = document.createElement("fluid-toast-item") as FluidToastItem;
    sibling.duration = 0;
    sibling.textContent = "Background update complete";
    el.append(sibling);
    await sibling.updateComplete;
    sibling.remove();
    await aTimeout(0);

    expect(el.firstElementChild === focusedItem).to.equal(true);
    expect(document.activeElement === action).to.equal(true);
  });
});

describe("<fluid-toast-item>", () => {
  it("uses role=alert for danger variant", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item variant="danger" .duration=${0}>Oops</fluid-toast-item>
    `);
    expect(el.getAttribute("role")).to.equal("alert");
  });

  it("uses role=status for other variants", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>Info</fluid-toast-item>
    `);
    expect(el.getAttribute("role")).to.equal("status");
  });

  it("updates its live-region role when the variant changes", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>Status changed</fluid-toast-item>
    `);
    expect(el.getAttribute("role")).to.equal("status");

    el.variant = "danger";
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("alert");

    el.variant = "success";
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("status");
  });

  it("pauses and resumes auto-dismiss for hover and focus", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${50}>Connection restored</fluid-toast-item>
    `);
    el.dispatchEvent(new MouseEvent("mouseenter"));
    await aTimeout(70);
    await el.updateComplete;
    expect(el.hasAttribute("dismissing"), "hover pauses the timer").to.equal(false);

    el.dispatchEvent(new MouseEvent("mouseleave"));
    await aTimeout(20);
    const close = el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!;
    close.focus();
    await aTimeout(70);
    await el.updateComplete;
    expect(el.hasAttribute("dismissing"), "focus pauses the resumed timer").to.equal(false);

    close.blur();
    await aTimeout(60);
    await el.updateComplete;
    expect(el.hasAttribute("dismissing"), "the timer resumes after focus leaves").to.equal(true);
  });

  it("restarts an unfinished auto-dismiss timer after reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div></div>`);
    const el = document.createElement("fluid-toast-item") as FluidToastItem;
    el.duration = 35;
    wrapper.append(el);
    await el.updateComplete;
    await aTimeout(15);

    el.remove();
    await aTimeout(45);
    expect(el.hasAttribute("dismissing")).to.equal(false);

    wrapper.append(el);
    await aTimeout(45);
    await el.updateComplete;
    expect(el.hasAttribute("dismissing")).to.equal(true);
  });

  it("reconciles duration changes without retaining stale timers", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${60}>Build complete</fluid-toast-item>
    `);
    await aTimeout(15);
    el.duration = 0;
    await el.updateComplete;
    await aTimeout(60);
    expect(el.hasAttribute("dismissing"), "duration=0 cancels the old timer").to.equal(false);

    el.duration = 25;
    await el.updateComplete;
    await aTimeout(35);
    await el.updateComplete;
    expect(el.hasAttribute("dismissing"), "a positive duration starts a new timer").to.equal(true);
  });

  it("emits one dismiss when timeout and close activation race", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${25}>Session expiring</fluid-toast-item>
    `);
    let dismisses = 0;
    el.addEventListener("fluid-dismiss", () => dismisses++);
    await aTimeout(15);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!.click();
    await aTimeout(230);
    expect(dismisses).to.equal(1);
  });

  it("cancels a pending exit callback when disconnected", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>Removed notification</fluid-toast-item>
    `);
    let dismisses = 0;
    el.addEventListener("fluid-dismiss", () => dismisses++);
    el.dismiss();
    await el.updateComplete;
    expect(el.hasAttribute("dismissing")).to.equal(true);

    el.remove();
    await aTimeout(220);
    expect(dismisses).to.equal(0);
  });

  /* Rework: override ladder + AAA target floor. */

  it("background reads the --fluid-toast-item-* override ladder", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>x</fluid-toast-item>
    `);
    el.style.setProperty("--fluid-toast-item-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the close button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>x</fluid-toast-item>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
