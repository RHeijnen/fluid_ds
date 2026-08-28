import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "@fluid-ds/components/define/context-menu";
import "@fluid-ds/components/define/scroller";
import "@fluid-ds/components/define/tour";
import "@fluid-ds/components/define/mosaic";
import type { FluidContextMenu } from "../../../packages/components/src/components/context-menu/fluid-context-menu.js";
import type { FluidTour } from "../../../packages/components/src/components/tour/fluid-tour.js";
import type { FluidMosaic } from "../../../packages/components/src/components/mosaic/fluid-mosaic.js";

const meta: Meta = {
  title: "Quality/Navigation interaction contracts",
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

// Native-key routing is independently exercised in navigation-interactions.spec.ts.
// user-event 14 loses host focus when an empty shadow root has no active element.
async function pressHostKey(host: HTMLElement, key: string) {
  await expect((host.getRootNode() as Document | ShadowRoot).activeElement).toBe(host);
  host.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true })
  );
  host.dispatchEvent(
    new KeyboardEvent("keyup", { key, bubbles: true, composed: true, cancelable: true })
  );
}

export const ContextMenuContract: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-context-menu" } },
  render: () => html`
    <fluid-context-menu
      aria-label="Document actions"
      .items=${[
        { label: "Cut", value: "cut" },
        { label: "Unavailable", value: "disabled", disabled: true },
        { label: "Copy", value: "copy" }
      ]}
    >
      <button slot="trigger">Document actions</button>
    </fluid-context-menu>
    <button id="after-context-menu">After context menu</button>
  `,
  play: async ({ canvasElement }) => {
    const context = canvasElement.querySelector<FluidContextMenu>("fluid-context-menu")!;
    const trigger = context.querySelector<HTMLButtonElement>("button")!;
    const items = [...context.shadowRoot!.querySelectorAll<HTMLElement>("fluid-menu-item")];
    const events: Event[] = [];
    const record = (event: Event) => events.push(event);
    for (const name of ["fluid-show", "fluid-hide", "fluid-select"])
      context.addEventListener(name, record);
    try {
      trigger.focus();
      await userEvent.keyboard("{Shift>}{F10}{/Shift}");
      await waitFor(() => expect(context.shadowRoot!.activeElement).toBe(items[0]));
      await expect(trigger.getAttribute("aria-expanded")).toBe("true");
      await pressHostKey(items[0]!, "ArrowDown");
      await expect(context.shadowRoot!.activeElement).toBe(items[2]);
      await pressHostKey(items[2]!, "Enter");
      await waitFor(() => expect(context.open).toBe(false));
      await expect(document.activeElement).toBe(trigger);
      await expect(
        (events.find((event) => event.type === "fluid-select") as CustomEvent).detail.value
      ).toBe("copy");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
      await waitFor(() => expect(context.open).toBe(true));
      await waitFor(() =>
        expect(context.shadowRoot!.activeElement?.localName).toBe("fluid-menu-item")
      );
      await userEvent.click(items[1]!);
      await expect(context.open).toBe(true);
      await expect(events.filter((event) => event.type === "fluid-select")).toHaveLength(1);
      const focused = context.shadowRoot!.activeElement as HTMLElement;
      // A disabled pointer target is not focusable; retain focus on the active menu item.
      await pressHostKey(focused, "Escape");
      await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
      await expect(document.activeElement).toBe(trigger);
      await expect(events.filter((event) => event.type === "fluid-show")).toHaveLength(2);
      await expect(events.filter((event) => event.type === "fluid-hide")).toHaveLength(2);
      await expect(events.every((event) => event.bubbles && event.composed)).toBe(true);
    } finally {
      for (const name of ["fluid-show", "fluid-hide", "fluid-select"])
        context.removeEventListener(name, record);
    }
  }
};

export const ScrollerContract: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-scroller" } },
  render: () => html`
    <button id="before-scroller">Before scroller</button>
    <fluid-scroller style="width:240px;height:80px;">
      <div style="display:flex;justify-content:space-between;width:1000px;height:60px;">
        <button>First scroll action</button><button>Last scroll action</button>
      </div>
    </fluid-scroller>
    <button id="after-scroller">After scroller</button>
  `,
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector("fluid-scroller")!;
    const container = scroller.shadowRoot!.querySelector<HTMLElement>(".container")!;
    const [first, last] = [...scroller.querySelectorAll("button")];
    const start = scroller.shadowRoot!.querySelector(".fade.start")!;
    const end = scroller.shadowRoot!.querySelector(".fade.end")!;
    await waitFor(() => expect(end.hasAttribute("data-visible")).toBe(true));
    await expect(start.hasAttribute("data-visible")).toBe(false);
    // Browser focus scrolling, not a mocked scroll event or assigned scrollLeft.
    await userEvent.click(first!);
    await userEvent.tab();
    await expect(document.activeElement).toBe(last);
    await waitFor(() => expect(container.scrollLeft).toBeGreaterThan(600));
    await waitFor(() => expect(start.hasAttribute("data-visible")).toBe(true));
    await userEvent.tab();
    await expect(document.activeElement).toBe(canvasElement.querySelector("#after-scroller"));
    await userEvent.tab({ shift: true });
    await expect(document.activeElement).toBe(last);
    await userEvent.tab({ shift: true });
    await expect(document.activeElement).toBe(first);
    await waitFor(() => expect(container.scrollLeft).toBe(0));
    await waitFor(() => expect(start.hasAttribute("data-visible")).toBe(false));
  }
};

export const TourContract: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-tour" } },
  render: () => html`
    <button
      id="start-contract-tour"
      @click=${(event: Event) => {
        (event.currentTarget as HTMLElement)
          .parentElement!.querySelector<FluidTour>("fluid-tour")!
          .show();
      }}
    >
      Start tour
    </button>
    <button id="tour-target-one">First target</button>
    <button id="tour-target-two">Second target</button>
    <fluid-tour
      .steps=${[
        { target: "#tour-target-one", title: "First step", body: "Review the first target." },
        { target: "#tour-target-two", title: "Second step", body: "Review the second target." }
      ]}
    ></fluid-tour>
    <button id="after-contract-tour">After tour</button>
  `,
  play: async ({ canvasElement }) => {
    const tour = canvasElement.querySelector<FluidTour>("fluid-tour")!;
    const start = canvasElement.querySelector<HTMLButtonElement>("#start-contract-tour")!;
    const control = (name: string) =>
      tour.shadowRoot!.querySelector<HTMLElement>(`.action-${name}`)!;
    const button = (name: string) =>
      control(name).shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    const events: Event[] = [];
    const record = (event: Event) => events.push(event);
    for (const name of ["fluid-step-change", "fluid-finish", "fluid-skip"])
      tour.addEventListener(name, record);
    try {
      await userEvent.click(start);
      await waitFor(() => expect(tour.shadowRoot!.activeElement).toBe(control("next")));
      // Native Playwright owns Tab traversal through the nested button shadows;
      // user-event 14 cannot calculate that composed-tree Tab order.
      await userEvent.click(button("skip"));
      await waitFor(() => expect(tour.open).toBe(false));
      await expect(document.activeElement).toBe(start);
      await userEvent.click(start);
      await waitFor(() => expect(tour.shadowRoot!.activeElement).toBe(control("next")));
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(tour.index).toBe(1));
      await waitFor(() =>
        expect(tour.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
          "Second step"
        )
      );
      await userEvent.click(button("back"));
      await waitFor(() => expect(tour.index).toBe(0));
      await userEvent.click(button("next"));
      await waitFor(() => expect(control("next").textContent).toContain("Done"));
      await userEvent.click(button("next"));
      await waitFor(() => expect(tour.open).toBe(false));
      await expect(document.activeElement).toBe(start);
      await expect(
        events
          .filter((event) => event.type === "fluid-step-change")
          .map((event) => (event as CustomEvent).detail.index)
      ).toEqual([1, 0, 1]);
      await expect(events.filter((event) => event.type === "fluid-finish")).toHaveLength(1);
      await userEvent.click(start);
      await waitFor(() => expect(tour.shadowRoot!.activeElement).toBe(control("next")));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(tour.open).toBe(false));
      await expect(document.activeElement).toBe(start);
      await expect(events.filter((event) => event.type === "fluid-skip")).toHaveLength(2);
      await expect(
        events.every((event) => event.target === tour && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      for (const name of ["fluid-step-change", "fluid-finish", "fluid-skip"])
        tour.removeEventListener(name, record);
    }
  }
};

// Native Playwright cases own their inputs. These render-only fixtures prevent
// a story play function racing the independent browser keyboard sequence.
export const ContextMenuKeyboardFixture: Story = { render: ContextMenuContract.render };
export const ScrollerKeyboardFixture: Story = { render: ScrollerContract.render };
export const TourKeyboardFixture: Story = { render: TourContract.render };

// Mosaic is layout, not an interactive widget. This useful composition fixture
// intentionally has no interaction-contract tag or componentTag attribution.
export const MosaicLayoutFixture: Story = {
  render: () => html`
    <button id="before-mosaic">Before mosaic</button>
    <fluid-mosaic cols="2" row-height="60px" gap="8px" style="width:320px;">
      <fluid-mosaic-item><button>First mosaic action</button></fluid-mosaic-item>
      <fluid-mosaic-item><button>Second mosaic action</button></fluid-mosaic-item>
      <fluid-mosaic-item><button>Third mosaic action</button></fluid-mosaic-item>
    </fluid-mosaic>
    <button id="after-mosaic">After mosaic</button>
    <button
      id="reflow-mosaic"
      @click=${(event: Event) => {
        (event.currentTarget as HTMLElement).parentElement!.querySelector<FluidMosaic>(
          "fluid-mosaic"
        )!.cols = 1;
      }}
    >
      Use one column
    </button>
  `
};
