import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "@fluid-ds/components/define/accordion";
import "@fluid-ds/components/define/anchor-nav";
import "@fluid-ds/components/define/app-bar";
import "@fluid-ds/components/define/banner";
import "@fluid-ds/components/define/breadcrumb";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/calendar";
import "@fluid-ds/components/define/carousel";
import "@fluid-ds/components/define/checkbox";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/color-picker";
import "@fluid-ds/components/define/command-palette";
import "@fluid-ds/components/define/comparison";
import "@fluid-ds/components/define/copy-button";
import "@fluid-ds/components/define/date-picker";
import "@fluid-ds/components/define/date-range-picker";
import "@fluid-ds/components/define/dialog";
import "@fluid-ds/components/define/dropdown";
import "@fluid-ds/components/define/dropzone";
import "@fluid-ds/components/define/drawer";
import "@fluid-ds/components/define/fold";
import "@fluid-ds/components/define/file-input";
import "@fluid-ds/components/define/form";
import "@fluid-ds/components/define/hotkey";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/list";
import "@fluid-ds/components/define/masked-input";
import "@fluid-ds/components/define/menu";
import "@fluid-ds/components/define/number-input";
import "@fluid-ds/components/define/otp";
import "@fluid-ds/components/define/pagination";
import "@fluid-ds/components/define/popover";
import "@fluid-ds/components/define/popconfirm";
import "@fluid-ds/components/define/radio";
import "@fluid-ds/components/define/range-slider";
import "@fluid-ds/components/define/rating";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/sidebar";
import "@fluid-ds/components/define/split-panel";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/speed-dial";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/tag-input";
import "@fluid-ds/components/define/tabs";
import "@fluid-ds/components/define/textarea";
import "@fluid-ds/components/define/theme-toggle";
import "@fluid-ds/components/define/time-picker";
import "@fluid-ds/components/define/toast";
import "@fluid-ds/components/define/tooltip";
import "@fluid-ds/components/define/toolbar";
import "@fluid-ds/components/define/transfer";
import "@fluid-ds/components/define/truncate";
import "@fluid-ds/components/define/tree";
import "@fluid-ds/components/define/typeahead";
import "../../../packages/media/src/components/lightbox/define.js";
import "../../../packages/media/src/components/animated-image/define.js";
import "../../../packages/media/src/components/audio/define.js";
import "../../../packages/scheduler/src/components/time-slots/define.js";

const meta: Meta = {
  title: "Quality/Interaction contracts",
  tags: ["interaction-contract"],
  parameters: {
    controls: { disable: true },
    status: { type: "experimental" }
  }
};

export default meta;
type Story = StoryObj;

// user-event 14.5.2 descends into a focused host's shadow root even when that
// root has no active element, then sends keys to body. For host-focused custom
// controls, assert real focus before dispatching. Native Playwright cases in
// apps/a11y additionally verify browser keyboard routing for these contracts.
async function pressHostKey(host: HTMLElement, key: string) {
  await expect((host.getRootNode() as Document | ShadowRoot).activeElement).toBe(host);
  host.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true })
  );
  host.dispatchEvent(
    new KeyboardEvent("keyup", { key, bubbles: true, composed: true, cancelable: true })
  );
}

export const OptionSelectionContract: Story = {
  parameters: { quality: { componentTag: "fluid-option" } },
  render: () => html`
    <form>
      <fluid-select name="plan" aria-label="Plan">
        <fluid-option value="unavailable" disabled>Unavailable</fluid-option>
        <fluid-option value="free">Free</fluid-option>
        <fluid-option value="paused" disabled>Paused</fluid-option>
        <fluid-option value="pro">Pro</fluid-option>
      </fluid-select>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector("form")!;
    const select = form.querySelector("fluid-select")!;
    const trigger = select.shadowRoot!.querySelector("button")!;
    const [disabled, free, , pro] = [...select.querySelectorAll("fluid-option")];
    const events: CustomEvent<{ value: string }>[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent<{ value: string }>);
    select.addEventListener("fluid-change", listener);
    try {
      await expect(disabled!.getAttribute("role")).toBe("option");
      await expect(disabled!.getAttribute("aria-disabled")).toBe("true");
      await userEvent.click(trigger);
      await waitFor(() => expect(free!.hasAttribute("active")).toBe(true));
      await expect(disabled!.hasAttribute("active")).toBe(false);
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(pro!.hasAttribute("active")).toBe(true));
      await expect(select.shadowRoot!.activeElement).toBe(trigger);
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(pro!.getAttribute("aria-selected")).toBe("true"));
      await expect(free!.getAttribute("aria-selected")).toBe("false");
      await expect(new FormData(form).get("plan")).toBe("pro");
      await userEvent.click(trigger);
      await userEvent.click(disabled!);
      await expect(events.length).toBe(1);
      await expect(trigger.getAttribute("aria-expanded")).toBe("true");
      await userEvent.click(free!);
      await waitFor(() => expect(free!.getAttribute("aria-selected")).toBe("true"));
      await expect(pro!.getAttribute("aria-selected")).toBe("false");
      await expect(new FormData(form).get("plan")).toBe("free");
      await userEvent.click(trigger);
      await userEvent.keyboard("{End}{Escape}");
      await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
      await expect(new FormData(form).get("plan")).toBe("free");
      await expect(events.map((event) => event.detail.value)).toEqual(["pro", "free"]);
      await expect(
        events.every((event) => event.target === select && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      select.removeEventListener("fluid-change", listener);
    }
  }
};

export const TreeItemSelectionContract: Story = {
  parameters: { quality: { componentTag: "fluid-tree-item" } },
  render: () => html`
    <fluid-tree aria-label="Project files">
      <fluid-tree-item id="contract-folder" aria-label="Source">
        Source
        <fluid-tree-item id="contract-index">index.ts</fluid-tree-item>
        <fluid-tree-item id="contract-disabled" disabled>Unavailable</fluid-tree-item>
        <fluid-tree-item id="contract-app">app.ts</fluid-tree-item>
      </fluid-tree-item>
      <fluid-tree-item id="contract-readme">README.md</fluid-tree-item>
    </fluid-tree>
  `,
  play: async ({ canvasElement }) => {
    const tree = canvasElement.querySelector("fluid-tree")!;
    const [folder, index, disabled, app, readme] = [...tree.querySelectorAll("fluid-tree-item")];
    const selected: CustomEvent<{ item: HTMLElement }>[] = [];
    const listener = (event: Event) => selected.push(event as CustomEvent<{ item: HTMLElement }>);
    canvasElement.addEventListener("fluid-select", listener);
    try {
      await expect(index!.getAttribute("role")).toBe("treeitem");
      await expect(index!.hasAttribute("aria-expanded")).toBe(false);
      await expect(index!.getAttribute("aria-level")).toBe("2");
      folder!.focus();
      await pressHostKey(folder!, "ArrowRight");
      await waitFor(() => expect(folder!.getAttribute("aria-expanded")).toBe("true"));
      await pressHostKey(folder!, "ArrowRight");
      await expect(document.activeElement).toBe(index);
      await pressHostKey(index!, "ArrowDown");
      await expect(document.activeElement).toBe(app);
      await pressHostKey(app!, "Enter");
      await waitFor(() => expect(app!.getAttribute("aria-selected")).toBe("true"));
      await pressHostKey(app!, "End");
      await pressHostKey(readme!, " ");
      await waitFor(() => expect(readme!.getAttribute("aria-selected")).toBe("true"));
      await expect(app!.getAttribute("aria-selected")).toBe("false");
      await expect(disabled!.getAttribute("aria-disabled")).toBe("true");
      disabled!.focus();
      await pressHostKey(disabled!, "Enter");
      await expect(selected.length).toBe(2);
      await userEvent.click(index!.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!);
      await waitFor(() => expect(index!.getAttribute("aria-selected")).toBe("true"));
      await expect(selected.map((event) => event.detail.item.id)).toEqual([
        app!.id,
        readme!.id,
        index!.id
      ]);
      await expect(
        selected.every(
          (event) => event.target === event.detail.item && event.bubbles && event.composed
        )
      ).toBe(true);
      await userEvent.click(folder!.shadowRoot!.querySelector<HTMLElement>(".chevron")!);
      await waitFor(() => expect(folder!.getAttribute("aria-expanded")).toBe("false"));
      await expect(index!.tabIndex).toBe(-1);
      await expect(tree.tabIndex).toBe(-1);
      folder!.focus();
      await pressHostKey(folder!, "r");
      await expect(document.activeElement).toBe(readme);
    } finally {
      canvasElement.removeEventListener("fluid-select", listener);
    }
  }
};

export const MenuItemActivationContract: Story = {
  parameters: { quality: { componentTag: "fluid-menu-item" } },
  render: () => html`
    <fluid-menu aria-label="File actions">
      <fluid-menu-item value="new">New</fluid-menu-item>
      <fluid-menu-item value="delete" disabled>Delete</fluid-menu-item>
      <fluid-menu-item value="open">Open</fluid-menu-item>
    </fluid-menu>
  `,
  play: async ({ canvasElement }) => {
    const menu = canvasElement.querySelector("fluid-menu")!;
    const [first, disabled, last] = [...menu.querySelectorAll("fluid-menu-item")];
    const events: CustomEvent<{ value: string }>[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent<{ value: string }>);
    menu.addEventListener("fluid-select", listener);
    try {
      await expect(first!.getAttribute("role")).toBe("menuitem");
      await expect(disabled!.getAttribute("aria-disabled")).toBe("true");
      first!.focus();
      await pressHostKey(first!, "ArrowDown");
      await expect(document.activeElement).toBe(last);
      await expect(last!.tabIndex).toBe(0);
      await expect(first!.tabIndex).toBe(-1);
      await pressHostKey(last!, "Enter");
      await pressHostKey(last!, " ");
      await expect(events.map((event) => event.detail.value)).toEqual(["open", "open"]);
      await expect(
        events.every((event) => event.target === last && event.bubbles && event.composed)
      ).toBe(true);
      await userEvent.click(disabled!);
      await expect(events.length).toBe(2);
      await userEvent.click(first!);
      await expect(events.map((event) => event.detail.value)).toEqual(["open", "open", "new"]);
      first!.focus();
      await pressHostKey(first!, "o");
      await expect(document.activeElement).toBe(last);
      await expect(disabled!.tabIndex).toBe(-1);
    } finally {
      menu.removeEventListener("fluid-select", listener);
    }
  }
};

export const SegmentSelectionContract: Story = {
  parameters: { quality: { componentTag: "fluid-segment" } },
  render: () => html`
    <fluid-segmented-control value="day" aria-label="Calendar view">
      <fluid-segment value="day">Day</fluid-segment>
      <fluid-segment value="week" disabled>Week</fluid-segment>
      <fluid-segment value="month">Month</fluid-segment>
    </fluid-segmented-control>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector("fluid-segmented-control")!;
    const [day, disabled, month] = [...group.querySelectorAll("fluid-segment")];
    const values: string[] = [];
    const listener = (event: Event) =>
      values.push((event as CustomEvent<{ value: string }>).detail.value);
    group.addEventListener("fluid-change", listener);
    try {
      await expect(day!.getAttribute("role")).toBe("radio");
      await expect(day!.getAttribute("aria-checked")).toBe("true");
      await expect(disabled!.getAttribute("aria-disabled")).toBe("true");
      day!.focus();
      await pressHostKey(day!, "ArrowRight");
      await waitFor(() => expect(month!.getAttribute("aria-checked")).toBe("true"));
      await expect(document.activeElement).toBe(month);
      await expect(day!.getAttribute("aria-checked")).toBe("false");
      await expect(month!.tabIndex).toBe(0);
      await expect(day!.tabIndex).toBe(-1);
      await pressHostKey(month!, "ArrowRight");
      await waitFor(() => expect(day!.getAttribute("aria-checked")).toBe("true"));
      await expect(document.activeElement).toBe(day);
      await userEvent.click(disabled!);
      await expect(values).toEqual(["month", "day"]);
      await userEvent.click(month!);
      await waitFor(() => expect(values).toEqual(["month", "day", "month"]));
      await userEvent.click(month!);
      await expect(values).toEqual(["month", "day", "month"]);
      await expect(disabled!.tabIndex).toBe(-1);
    } finally {
      group.removeEventListener("fluid-change", listener);
    }
  }
};

export const TabManualActivationContract: Story = {
  parameters: { quality: { componentTag: "fluid-tab" } },
  render: () => html`
    <fluid-tabs value="one" activation="manual">
      <fluid-tab slot="nav" panel="one">One</fluid-tab>
      <fluid-tab slot="nav" panel="disabled" disabled>Unavailable</fluid-tab>
      <fluid-tab slot="nav" panel="two">Two</fluid-tab>
      <fluid-tab slot="nav" panel="three">Three</fluid-tab>
      <fluid-tab-panel name="one">First panel</fluid-tab-panel>
      <fluid-tab-panel name="disabled">Unavailable panel</fluid-tab-panel>
      <fluid-tab-panel name="two">Second panel</fluid-tab-panel>
      <fluid-tab-panel name="three">Third panel</fluid-tab-panel>
    </fluid-tabs>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-tabs")!;
    const [one, disabled, two, three] = [...host.querySelectorAll("fluid-tab")];
    const panels = [...host.querySelectorAll("fluid-tab-panel")];
    const values: string[] = [];
    const listener = (event: Event) =>
      values.push((event as CustomEvent<{ value: string }>).detail.value);
    host.addEventListener("fluid-change", listener);
    try {
      await expect(one!.getAttribute("role")).toBe("tab");
      await expect(disabled!.getAttribute("aria-disabled")).toBe("true");
      await expect(three!.getAttribute("aria-controls")).toBe(panels[3]!.id);
      await expect(panels[3]!.getAttribute("aria-labelledby")).toBe(three!.id);
      one!.focus();
      await pressHostKey(one!, "ArrowRight");
      await expect(document.activeElement).toBe(two);
      await pressHostKey(two!, "ArrowRight");
      await expect(document.activeElement).toBe(three);
      await expect(one!.getAttribute("aria-selected")).toBe("true");
      await expect(values).toEqual([]);
      await expect(three!.tabIndex).toBe(0);
      await expect(one!.tabIndex).toBe(-1);
      await pressHostKey(three!, "Enter");
      await waitFor(() => expect(three!.getAttribute("aria-selected")).toBe("true"));
      await expect(panels[0]!.hasAttribute("hidden")).toBe(true);
      await expect(panels[3]!.hasAttribute("hidden")).toBe(false);
      await pressHostKey(three!, "Home");
      await pressHostKey(one!, " ");
      await waitFor(() => expect(values).toEqual(["three", "one"]));
      await expect(document.activeElement).toBe(one);
      await userEvent.click(disabled!);
      await expect(values).toEqual(["three", "one"]);
      await userEvent.click(two!);
      await waitFor(() => expect(values).toEqual(["three", "one", "two"]));
    } finally {
      host.removeEventListener("fluid-change", listener);
    }
  }
};

export const ButtonActivation: Story = {
  parameters: { quality: { componentTag: "fluid-button" } },
  render: () => html`<fluid-button>Save</fluid-button>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-button")!;
    const button = host.shadowRoot!.querySelector("button")!;
    let activations = 0;
    host.addEventListener("click", () => activations++);
    await userEvent.click(button);
    await expect(activations).toBe(1);
  }
};

export const InputTyping: Story = {
  parameters: { quality: { componentTag: "fluid-input" } },
  render: () => html`<fluid-input label="Account name"></fluid-input>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-input") as HTMLElement & { value: string };
    const input = host.shadowRoot!.querySelector("input")!;
    await userEvent.type(input, "Fluid team");
    await expect(host.value).toBe("Fluid team");
  }
};

export const CheckboxToggle: Story = {
  parameters: { quality: { componentTag: "fluid-checkbox" } },
  render: () => html`<fluid-checkbox>Remember me</fluid-checkbox>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-checkbox") as HTMLElement & {
      checked: boolean;
    };
    await userEvent.click(host.shadowRoot!.querySelector("input")!);
    await expect(host.checked).toBe(true);
  }
};

export const SwitchToggle: Story = {
  parameters: { quality: { componentTag: "fluid-switch" } },
  render: () => html`<fluid-switch>Notifications</fluid-switch>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-switch") as HTMLElement & {
      checked: boolean;
    };
    await userEvent.click(host.shadowRoot!.querySelector("input")!);
    await expect(host.checked).toBe(true);
  }
};

export const DialogDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-dialog" } },
  render: () => html`<fluid-dialog open label="Confirm action">Dialog content</fluid-dialog>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-dialog") as HTMLElement & { open: boolean };
    const close = host.shadowRoot!.querySelector<HTMLButtonElement>("button.close");
    await expect(close).not.toBeNull();
    await userEvent.click(close!);
    await waitFor(() => expect(host.open).toBe(false));
  }
};

export const AccordionDisclosure: Story = {
  parameters: { quality: { componentTag: "fluid-details" } },
  render: () => html`
    <fluid-accordion>
      <fluid-details summary="Deployment">Deployment details</fluid-details>
    </fluid-accordion>
  `,
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector("fluid-details") as HTMLElement & { open: boolean };
    await userEvent.click(details.shadowRoot!.querySelector("button")!);
    await expect(details.open).toBe(true);
  }
};

export const TabsKeyboardNavigation: Story = {
  parameters: { quality: { componentTag: "fluid-tabs" } },
  render: () => html`
    <fluid-tabs value="one">
      <fluid-tab slot="nav" panel="one">One</fluid-tab>
      <fluid-tab slot="nav" panel="two">Two</fluid-tab>
      <fluid-tab-panel name="one">First panel</fluid-tab-panel>
      <fluid-tab-panel name="two">Second panel</fluid-tab-panel>
    </fluid-tabs>
  `,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("fluid-tabs") as HTMLElement & { value: string };
    const first = canvasElement.querySelector("fluid-tab")!;
    first.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true })
    );
    await waitFor(() => expect(tabs.value).toBe("two"));
  }
};

export const RadioKeyboardNavigation: Story = {
  parameters: { quality: { componentTag: "fluid-radio-group" } },
  render: () => html`
    <fluid-radio-group aria-label="Size" value="sm">
      <fluid-radio value="sm">Small</fluid-radio>
      <fluid-radio value="md">Medium</fluid-radio>
      <fluid-radio value="lg">Large</fluid-radio>
    </fluid-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector("fluid-radio-group") as HTMLElement & {
      value: string;
    };
    group.querySelector<HTMLElement>('fluid-radio[value="sm"]')!.focus();
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await waitFor(() => expect(group.value).toBe("md"));
  }
};

export const SliderInputEvent: Story = {
  parameters: { quality: { componentTag: "fluid-slider" } },
  render: () => html`<fluid-slider value="10" aria-label="Volume"></fluid-slider>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-slider") as HTMLElement & { value: string };
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.value = "42";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await expect(host.value).toBe("42");
  }
};

export const NumberInputStepper: Story = {
  parameters: { quality: { componentTag: "fluid-number-input" } },
  render: () => html`<fluid-number-input value="1" aria-label="Quantity"></fluid-number-input>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-number-input") as HTMLElement & {
      value: string;
    };
    await userEvent.click(host.shadowRoot!.querySelector('[part="stepper-up"]')!);
    await waitFor(() => expect(host.value).toBe("2"));
  }
};

export const PaginationNextPage: Story = {
  parameters: { quality: { componentTag: "fluid-pagination" } },
  render: () => html`<fluid-pagination total-pages="5" page="1"></fluid-pagination>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-pagination") as HTMLElement & { page: number };
    await userEvent.click(host.shadowRoot!.querySelector('[part~="next"]')!);
    await waitFor(() => expect(host.page).toBe(2));
  }
};

export const TagInputEntry: Story = {
  parameters: { quality: { componentTag: "fluid-tag-input" } },
  render: () => html`<fluid-tag-input label="Technologies"></fluid-tag-input>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-tag-input") as HTMLElement & {
      value: string[];
    };
    const input = host.shadowRoot!.querySelector("input")!;
    await userEvent.type(input, "Lit{enter}");
    await waitFor(() => expect(host.value).toEqual(["Lit"]));
  }
};

export const AccordionCoordination: Story = {
  parameters: { quality: { componentTag: "fluid-accordion" } },
  render: () => html`
    <fluid-accordion>
      <fluid-details summary="First">First panel</fluid-details>
      <fluid-details summary="Second">Second panel</fluid-details>
    </fluid-accordion>
  `,
  play: async ({ canvasElement }) => {
    const second = canvasElement.querySelectorAll("fluid-details")[1] as HTMLElement & {
      open: boolean;
    };
    await userEvent.click(second.shadowRoot!.querySelector("button")!);
    await waitFor(() => expect(second.open).toBe(true));
  }
};

export const TextareaTyping: Story = {
  parameters: { quality: { componentTag: "fluid-textarea" } },
  render: () => html`<fluid-textarea label="Release notes" maxlength="40"></fluid-textarea>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-textarea") as HTMLElement & { value: string };
    await userEvent.type(host.shadowRoot!.querySelector("textarea")!, "Ready for review");
    await expect(host.value).toBe("Ready for review");
  }
};

export const RatingKeyboardSelection: Story = {
  parameters: { quality: { componentTag: "fluid-rating" } },
  render: () => html`<fluid-rating value="2" aria-label="Quality"></fluid-rating>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-rating") as HTMLElement & { value: number };
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await waitFor(() => expect(host.value).toBe(3));
  }
};

export const RangeSliderKeyboardSelection: Story = {
  parameters: { quality: { componentTag: "fluid-range-slider" } },
  render: () => html`
    <fluid-range-slider value-min="20" value-max="80" aria-label="Price range"></fluid-range-slider>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-range-slider") as HTMLElement & {
      valueMin: number;
    };
    host
      .shadowRoot!.querySelector<HTMLButtonElement>('[part~="thumb-min"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await waitFor(() => expect(host.valueMin).toBe(21));
  }
};

export const SegmentedControlSelection: Story = {
  parameters: { quality: { componentTag: "fluid-segmented-control" } },
  render: () => html`
    <fluid-segmented-control value="list" aria-label="View">
      <fluid-segment value="list">List</fluid-segment>
      <fluid-segment value="grid">Grid</fluid-segment>
    </fluid-segmented-control>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-segmented-control") as HTMLElement & {
      value: string;
    };
    await userEvent.click(host.querySelector('fluid-segment[value="grid"]')!);
    await waitFor(() => expect(host.value).toBe("grid"));
  }
};

export const DrawerDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-drawer" } },
  render: () => html`<fluid-drawer open label="Filters">Filter controls</fluid-drawer>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-drawer") as HTMLElement & { open: boolean };
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.close")!);
    await waitFor(() => expect(host.open).toBe(false));
  }
};

export const FoldDisclosure: Story = {
  parameters: { quality: { componentTag: "fluid-fold" } },
  render: () => html`<fluid-fold label="Show explanation">Additional explanation</fluid-fold>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-fold") as HTMLElement & { open: boolean };
    await userEvent.click(host.shadowRoot!.querySelector("button")!);
    await waitFor(() => expect(host.open).toBe(true));
  }
};

export const RemovableTag: Story = {
  parameters: { quality: { componentTag: "fluid-tag" } },
  render: () => html`<fluid-tag removable>Needs review</fluid-tag>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-tag")!;
    let removals = 0;
    host.addEventListener("fluid-remove", () => (removals += 1));
    await userEvent.click(host.shadowRoot!.querySelector("button.remove")!);
    await expect(removals).toBe(1);
  }
};

export const DatePickerKeyboardOpenClose: Story = {
  parameters: { quality: { componentTag: "fluid-date-picker" } },
  render: () => html`<fluid-date-picker label="Start date" value="2026-08-25"></fluid-date-picker>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-date-picker") as HTMLElement & {
      open: boolean;
    };
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await waitFor(() => expect(host.open).toBe(true));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitFor(() => expect(host.open).toBe(false));
  }
};

export const OtpCompletion: Story = {
  parameters: { quality: { componentTag: "fluid-otp" } },
  render: () => html`<fluid-otp length="4" aria-label="Verification code"></fluid-otp>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-otp") as HTMLElement & { value: string };
    const inputs = host.shadowRoot!.querySelectorAll<HTMLInputElement>("input");
    for (const [index, digit] of ["1", "2", "3", "4"].entries()) {
      await userEvent.type(inputs[index]!, digit);
    }
    await waitFor(() => expect(host.value).toBe("1234"));
  }
};

export const MaskedInputFormatting: Story = {
  parameters: { quality: { componentTag: "fluid-masked-input" } },
  render: () => html`
    <fluid-masked-input mask="(###) ###-####" aria-label="Phone number"></fluid-masked-input>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-masked-input") as HTMLElement & {
      value: string;
    };
    await userEvent.type(host.shadowRoot!.querySelector("input")!, "1234567890");
    await waitFor(() => expect(host.value).toBe("(123) 456-7890"));
  }
};

export const SelectOption: Story = {
  parameters: { quality: { componentTag: "fluid-select" } },
  render: () => html`
    <fluid-select aria-label="Country" placeholder="Choose">
      <fluid-option value="nl">Netherlands</fluid-option>
      <fluid-option value="be">Belgium</fluid-option>
    </fluid-select>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-select") as HTMLElement & { value: string };
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.trigger")!);
    await userEvent.click(host.querySelector('fluid-option[value="be"]')!);
    await waitFor(() => expect(host.value).toBe("be"));
  }
};

export const PopoverOpenClose: Story = {
  parameters: { quality: { componentTag: "fluid-popover" } },
  render: () => html`
    <fluid-popover>
      <fluid-button slot="trigger">More information</fluid-button>
      <p>Popover content</p>
    </fluid-popover>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-popover") as HTMLElement & { open: boolean };
    const trigger = host.querySelector("fluid-button")!;
    await userEvent.click(trigger.shadowRoot!.querySelector("button")!);
    await waitFor(() => expect(host.open).toBe(true));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitFor(() => expect(host.open).toBe(false));
  }
};

export const BannerDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-banner" } },
  render: () => html`<fluid-banner dismissible>Scheduled maintenance</fluid-banner>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-banner")!;
    let dismissals = 0;
    host.addEventListener("fluid-dismiss", () => (dismissals += 1));
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.dismiss")!);
    await expect(dismissals).toBe(1);
    await waitFor(() => expect(host.isConnected).toBe(false));
  }
};

export const CalloutDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-callout" } },
  render: () => html`<fluid-callout dismissible>Review the warning</fluid-callout>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-callout")!;
    let dismissals = 0;
    host.addEventListener("fluid-dismiss", () => (dismissals += 1));
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.close")!);
    await expect(dismissals).toBe(1);
  }
};

export const CopyButtonClipboard: Story = {
  parameters: { quality: { componentTag: "fluid-copy-button" } },
  render: () => html`<fluid-copy-button value="pnpm install">Copy command</fluid-copy-button>`,
  play: async ({ canvasElement }) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const host = canvasElement.querySelector("fluid-copy-button")!;
    let copied = false;
    host.addEventListener("fluid-copy", (event) => {
      copied = (event as CustomEvent<{ success: boolean }>).detail.success;
    });
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button")!);
    await waitFor(() => expect(copied).toBe(true));
    await expect(host.shadowRoot!.querySelector(".copied")).not.toBeNull();
  }
};

export const ThemeToggleSelection: Story = {
  parameters: { quality: { componentTag: "fluid-theme-toggle" } },
  render: () => html`<fluid-theme-toggle no-persist></fluid-theme-toggle>`,
  play: async ({ canvasElement }) => {
    document.documentElement.setAttribute("data-fluid-theme", "light");
    const host = canvasElement.querySelector("fluid-theme-toggle") as HTMLElement & {
      theme: string;
    };
    await userEvent.click(
      host.shadowRoot!.querySelector<HTMLButtonElement>('[part="theme-button"]')!
    );
    await waitFor(() => expect(host.theme).toBe("dark"));
    await expect(document.documentElement.getAttribute("data-fluid-theme")).toBe("dark");
  }
};

export const DropdownSelection: Story = {
  parameters: { quality: { componentTag: "fluid-dropdown" } },
  render: () => html`
    <fluid-dropdown>
      <button slot="trigger">Actions</button>
      <fluid-dropdown-item value="edit">Edit</fluid-dropdown-item>
      <fluid-dropdown-item value="archive">Archive</fluid-dropdown-item>
    </fluid-dropdown>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-dropdown") as HTMLElement & {
      open: boolean;
    };
    let selection = "";
    host.addEventListener("fluid-select", (event) => {
      selection = (event as CustomEvent<{ value: string }>).detail.value;
    });
    await userEvent.click(host.querySelector<HTMLButtonElement>('button[slot="trigger"]')!);
    await waitFor(() => expect(host.open).toBe(true));
    await userEvent.click(host.querySelector('fluid-dropdown-item[value="archive"]')!);
    await waitFor(() => expect(selection).toBe("archive"));
    await expect(host.open).toBe(false);
  }
};

export const PopconfirmConfirmation: Story = {
  parameters: { quality: { componentTag: "fluid-popconfirm" } },
  render: () => html`
    <fluid-popconfirm message="Delete this item?">
      <fluid-button slot="trigger">Delete</fluid-button>
    </fluid-popconfirm>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-popconfirm") as HTMLElement & {
      open: boolean;
    };
    let confirmations = 0;
    host.addEventListener("fluid-confirm", () => (confirmations += 1));
    const trigger = host.querySelector("fluid-button")!;
    await userEvent.click(trigger.shadowRoot!.querySelector("button")!);
    await waitFor(() => expect(host.open).toBe(true));
    const confirm = host.shadowRoot!.querySelector("fluid-button.confirm")!;
    await userEvent.click(confirm.shadowRoot!.querySelector("button")!);
    await waitFor(() => expect(confirmations).toBe(1));
    await expect(host.open).toBe(false);
  }
};

export const SpeedDialKeyboardDisclosure: Story = {
  parameters: { quality: { componentTag: "fluid-speed-dial" } },
  render: () => html`
    <fluid-speed-dial label="Quick actions" placement="up">
      <button>Share</button>
      <button disabled>Edit</button>
      <button>Delete</button>
    </fluid-speed-dial>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-speed-dial") as HTMLElement & {
      open: boolean;
    };
    const trigger = host.shadowRoot!.querySelector<HTMLButtonElement>("button.trigger")!;
    host.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => expect(host.open).toBe(true));
    await waitFor(() =>
      expect(document.activeElement).toBe(host.querySelector("button:not([disabled])"))
    );
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    await waitFor(() => expect(host.open).toBe(false));
  }
};

export const RadioSelection: Story = {
  parameters: { quality: { componentTag: "fluid-radio" } },
  render: () => html`
    <fluid-radio-group aria-label="Decision">
      <fluid-radio value="yes">Yes</fluid-radio>
      <fluid-radio value="no">No</fluid-radio>
    </fluid-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector("fluid-radio-group") as HTMLElement & {
      value: string;
    };
    await userEvent.click(group.querySelector('fluid-radio[value="yes"]')!);
    await waitFor(() => expect(group.value).toBe("yes"));
    await expect(group.querySelector('fluid-radio[value="yes"]')!.hasAttribute("checked")).toBe(
      true
    );
  }
};

export const CalendarDateActivation: Story = {
  parameters: { quality: { componentTag: "fluid-calendar" } },
  render: () => html`<fluid-calendar value="2026-06-15"></fluid-calendar>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-calendar")!;
    let activated = "";
    host.addEventListener("fluid-date-activate", (event) => {
      activated = (event as CustomEvent<{ iso: string }>).detail.iso;
    });
    const days = Array.from(
      host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.day:not(.outside)")
    );
    const day20 = days.find((day) => day.textContent?.trim() === "20")!;
    await userEvent.click(day20);
    await waitFor(() => expect(activated).toBe("2026-06-20"));
  }
};

export const DateRangePresetApplication: Story = {
  parameters: { quality: { componentTag: "fluid-date-range-picker" } },
  render: () =>
    html`<fluid-date-range-picker aria-label="Reporting range"></fluid-date-range-picker>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-date-range-picker") as HTMLElement & {
      open: boolean;
      start: string;
      end: string;
    };
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.trigger")!);
    await waitFor(() => expect(host.open).toBe(true));
    const presets = Array.from(
      host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.preset")
    );
    const lastSeven = presets.find((button) => button.textContent?.trim() === "Last 7 days")!;
    await userEvent.click(lastSeven);
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>("button.apply")!);
    await waitFor(() => expect(host.open).toBe(false));
    await expect(host.start).not.toBe("");
    await expect(host.end).not.toBe("");
  }
};

export const TimePickerKeyboardSelection: Story = {
  parameters: { quality: { componentTag: "fluid-time-picker" } },
  render: () => html`
    <fluid-time-picker aria-label="Start time" min="09:00" max="10:00" step="30">
    </fluid-time-picker>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-time-picker") as HTMLElement & {
      open: boolean;
      value: string;
    };
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await waitFor(() => expect(host.open).toBe(true));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => expect(host.value).toBe("09:30"));
    await expect(host.open).toBe(false);
  }
};

export const TypeaheadKeyboardCommit: Story = {
  parameters: { quality: { componentTag: "fluid-typeahead" } },
  render: () => html`
    <fluid-typeahead
      aria-label="Fruit"
      .options=${["Apple", "Apricot", "Banana", "Blueberry"]}
    ></fluid-typeahead>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-typeahead") as HTMLElement & {
      open: boolean;
      value: string;
    };
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    await userEvent.type(input, "Ban");
    await waitFor(() => expect(host.open).toBe(true));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => expect(host.value).toBe("Banana"));
    await expect(host.open).toBe(false);
  }
};

export const TreeDisclosure: Story = {
  parameters: { quality: { componentTag: "fluid-tree" } },
  render: () => html`
    <fluid-tree>
      <fluid-tree-item id="source-folder">
        src
        <fluid-tree-item>index.ts</fluid-tree-item>
      </fluid-tree-item>
    </fluid-tree>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector("#source-folder") as HTMLElement & {
      expanded: boolean;
    };
    await userEvent.click(item.shadowRoot!.querySelector<HTMLElement>(".chevron")!);
    await waitFor(() => expect(item.expanded).toBe(true));
    await expect(item.getAttribute("aria-expanded")).toBe("true");
  }
};

export const TransferSelection: Story = {
  parameters: { quality: { componentTag: "fluid-transfer" } },
  render: () => html`
    <fluid-transfer
      .items=${[
        { id: "a", label: "Apple" },
        { id: "b", label: "Banana" },
        { id: "c", label: "Cherry" }
      ]}
    ></fluid-transfer>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-transfer") as HTMLElement & {
      value: string[];
    };
    const source = host.shadowRoot!.querySelector<HTMLElement>("#transfer-source")!;
    await userEvent.click(source.querySelector<HTMLElement>('[role="option"]')!);
    await userEvent.click(
      host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.button")[0]!
    );
    await waitFor(() => expect(host.value).toEqual(["a"]));
  }
};

export const CommandPaletteKeyboardSelection: Story = {
  parameters: { quality: { componentTag: "fluid-command-palette" } },
  render: () => html`
    <fluid-command-palette
      open
      .items=${[
        { id: "new", label: "New File", group: "File" },
        { id: "open", label: "Open File", group: "File" },
        { id: "theme", label: "Toggle Theme", group: "View" }
      ]}
    ></fluid-command-palette>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-command-palette") as HTMLElement & {
      open: boolean;
    };
    let selected = "";
    host.addEventListener("fluid-select", (event) => {
      selected = (event as CustomEvent<{ id: string }>).detail.id;
    });
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => expect(selected).toBe("open"));
    await expect(host.open).toBe(false);
  }
};

export const TooltipFocusDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-tooltip" } },
  render: () => html`
    <fluid-tooltip content="Keyboard shortcut" show-delay="0" hide-delay="0">
      <button>Focus target</button>
    </fluid-tooltip>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-tooltip") as HTMLElement & {
      open: boolean;
      showDelay: number;
      hideDelay: number;
    };
    host.showDelay = 0;
    host.hideDelay = 0;
    const trigger = host.querySelector<HTMLButtonElement>("button")!;
    trigger.focus();
    const popover = host.shadowRoot!.querySelector<HTMLElement>(".popover")!;
    await waitFor(() => expect(popover.classList.contains("visible")).toBe(true));
    await expect(popover.getAttribute("aria-hidden")).toBe("false");
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitFor(() => expect(popover.classList.contains("visible")).toBe(false));
    await expect(popover.getAttribute("aria-hidden")).toBe("true");
  }
};

export const ColorPickerPreset: Story = {
  parameters: { quality: { componentTag: "fluid-color-picker" } },
  render: () => html`
    <fluid-color-picker
      aria-label="Accent color"
      .palette=${["#ff0000", "#00ff00", "#0000ff"]}
    ></fluid-color-picker>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-color-picker") as HTMLElement & {
      value: string;
    };
    await userEvent.click(
      host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.preset")[1]!
    );
    await waitFor(() => expect(host.value).toBe("#00ff00"));
  }
};

export const CarouselNavigation: Story = {
  parameters: { quality: { componentTag: "fluid-carousel" } },
  render: () => html`
    <fluid-carousel>
      <fluid-carousel-item>First slide</fluid-carousel-item>
      <fluid-carousel-item>Second slide</fluid-carousel-item>
      <fluid-carousel-item>Third slide</fluid-carousel-item>
    </fluid-carousel>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-carousel")!;
    const buttons = host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.nav-button");
    await userEvent.click(buttons[1]!);
    await waitFor(() => {
      const dots = host.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.dot");
      expect(dots[1]!.getAttribute("aria-current")).toBe("true");
    });
  }
};

export const CodeBlockCopy: Story = {
  parameters: { quality: { componentTag: "fluid-code-block" } },
  render: () => html`<fluid-code-block code="pnpm test" language="shell"></fluid-code-block>`,
  play: async ({ canvasElement }) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const host = canvasElement.querySelector("fluid-code-block")!;
    let copied = "";
    host.addEventListener("fluid-copy", (event) => {
      copied = (event as CustomEvent<{ text: string }>).detail.text;
    });
    await userEvent.click(host.shadowRoot!.querySelector("fluid-button.copy")!);
    await waitFor(() => expect(copied).toBe("pnpm test"));
  }
};

export const ComparisonKeyboardPosition: Story = {
  parameters: { quality: { componentTag: "fluid-comparison" } },
  render: () => html`
    <fluid-comparison position="50" aria-label="Before and after">
      <div slot="before">Before</div>
      <div slot="after">After</div>
    </fluid-comparison>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-comparison") as HTMLElement & {
      position: number;
    };
    const separator = host.shadowRoot!.querySelector<HTMLElement>('[role="slider"]')!;
    separator.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true })
    );
    await waitFor(() => expect(host.position).toBe(60));
    await expect(separator.getAttribute("aria-valuenow")).toBe("60");
  }
};

export const FormSubmission: Story = {
  parameters: { quality: { componentTag: "fluid-form" } },
  render: () => html`
    <fluid-form>
      <input name="first" value="Ada" />
      <input name="last" value="Lovelace" />
      <button slot="actions" type="submit">Submit</button>
    </fluid-form>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-form")!;
    let values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
    host.addEventListener("fluid-submit", (event) => {
      values = (
        event as CustomEvent<{
          values: Record<string, FormDataEntryValue | FormDataEntryValue[]>;
        }>
      ).detail.values;
    });
    await userEvent.click(host.querySelector<HTMLButtonElement>('button[type="submit"]')!);
    await waitFor(() => expect(values).toEqual({ first: "Ada", last: "Lovelace" }));
  }
};

export const InteractiveListSelection: Story = {
  parameters: { quality: { componentTag: "fluid-list" } },
  render: () => html`
    <fluid-list label="Projects">
      <fluid-list-item interactive>Fluid</fluid-list-item>
      <fluid-list-item interactive>Documentation</fluid-list-item>
    </fluid-list>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelectorAll("fluid-list-item")[1]!;
    let selections = 0;
    item.addEventListener("fluid-select", () => (selections += 1));
    await userEvent.click(item.shadowRoot!.querySelector<HTMLButtonElement>("button")!);
    await waitFor(() => expect(selections).toBe(1));
  }
};

export const MenuSelection: Story = {
  parameters: { quality: { componentTag: "fluid-menu" } },
  render: () => html`
    <fluid-menu aria-label="Actions">
      <fluid-menu-item value="new">New</fluid-menu-item>
      <fluid-menu-item value="open">Open</fluid-menu-item>
      <fluid-menu-item value="save" disabled>Save</fluid-menu-item>
    </fluid-menu>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-menu")!;
    let selected = "";
    host.addEventListener("fluid-select", (event) => {
      selected = (event as CustomEvent<{ value: string }>).detail.value;
    });
    await userEvent.click(host.querySelector('fluid-menu-item[value="open"]')!);
    await waitFor(() => expect(selected).toBe("open"));
  }
};

export const SplitPanelKeyboardResize: Story = {
  parameters: { quality: { componentTag: "fluid-split-panel" } },
  render: () => html`
    <fluid-split-panel position="50">
      <div slot="start">Navigation</div>
      <div slot="end">Content</div>
    </fluid-split-panel>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-split-panel") as HTMLElement & {
      position: number;
    };
    const divider = host.shadowRoot!.querySelector<HTMLElement>(".divider")!;
    divider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await waitFor(() => expect(host.position).toBe(51));
    await expect(divider.getAttribute("aria-valuenow")).toBe("51");
  }
};

export const ToastDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-toast" } },
  render: () => html`<fluid-toast aria-label="Notifications"></fluid-toast>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-toast") as HTMLElement & {
      toast: (options: { message: string; duration: number }) => HTMLElement;
    };
    const item = host.toast({ message: "Profile saved", duration: 0 });
    await waitFor(() => expect(host.querySelectorAll("fluid-toast-item").length).toBe(1));
    await userEvent.click(item.shadowRoot!.querySelector<HTMLButtonElement>("button")!);
    await waitFor(() => expect(host.querySelectorAll("fluid-toast-item").length).toBe(0));
  }
};

export const ToastItemKeyboardAndPointerDismissal: Story = {
  parameters: { quality: { componentTag: "fluid-toast-item" } },
  render: () => html`
    <button
      @click=${(event: Event) => {
        const stack = (event.currentTarget as HTMLElement).parentElement!.querySelector(
          "fluid-toast"
        ) as HTMLElement & {
          toast: (options: { message: string; duration: number }) => HTMLElement;
        };
        stack.toast({ message: "Profile saved", duration: 0 });
      }}
    >
      Save profile
    </button>
    <fluid-toast placement="bottom-end"></fluid-toast>
  `,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector("button")!;
    const stack = canvasElement.querySelector("fluid-toast")!;
    const dismissals: Event[] = [];
    const onDismiss = (event: Event) => dismissals.push(event);
    canvasElement.addEventListener("fluid-dismiss", onDismiss);
    try {
      for (const method of ["keyboard", "pointer"]) {
        await userEvent.click(trigger);
        await waitFor(() => expect(stack.querySelector("fluid-toast-item")).not.toBeNull());
        const item = stack.querySelector("fluid-toast-item")!;
        await waitFor(() => expect(item.shadowRoot?.querySelector("button")).toBeTruthy());
        const close = item.shadowRoot!.querySelector("button")!;
        await expect(item.getAttribute("role")).toBe("status");
        await expect(item.textContent).toBe("Profile saved");
        await expect(document.activeElement).toBe(trigger);
        await expect(close.getAttribute("aria-label")).toBe("Dismiss");
        if (method === "keyboard") {
          close.focus();
          await expect(item.shadowRoot!.activeElement).toBe(close);
          await userEvent.keyboard("{Enter}");
        } else {
          await userEvent.click(close);
        }
        await waitFor(() => expect(item.isConnected).toBe(false));
        await expect(dismissals.length).toBe(method === "keyboard" ? 1 : 2);
        await expect(dismissals.at(-1)!.target).toBe(item);
        await expect(dismissals.at(-1)!.bubbles).toBe(true);
        await expect(dismissals.at(-1)!.composed).toBe(true);
      }
    } finally {
      canvasElement.removeEventListener("fluid-dismiss", onDismiss);
    }
  }
};

export const TruncateDisclosureContract: Story = {
  parameters: { quality: { componentTag: "fluid-truncate" } },
  render: () => html`
    <fluid-truncate lines="2" style="display: block; width: 16rem;">
      This description deliberately spans several lines so readers can expand it to see the complete
      content, then collapse it again without losing their place or focus. The disclosure should
      expose its current state to assistive technology.
    </fluid-truncate>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-truncate") as HTMLElement & {
      expanded: boolean;
    };
    const events: CustomEvent<{ expanded: boolean }>[] = [];
    const onToggle = (event: Event) => events.push(event as CustomEvent<{ expanded: boolean }>);
    host.addEventListener("fluid-toggle", onToggle);
    try {
      await waitFor(() => expect(host.shadowRoot?.querySelector("button")).toBeTruthy());
      const toggle = host.shadowRoot!.querySelector("button")!;
      const content = host.shadowRoot!.getElementById(toggle.getAttribute("aria-controls")!);
      await expect(content).not.toBeNull();
      await expect(toggle.getAttribute("aria-expanded")).toBe("false");
      await expect(content!.scrollHeight).toBeGreaterThan(content!.clientHeight);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle.getAttribute("aria-expanded")).toBe("true"));
      await expect(host.expanded).toBe(true);
      await expect(content!.scrollHeight - content!.clientHeight).toBeLessThanOrEqual(1);
      await expect(host.shadowRoot!.activeElement).toBe(toggle);
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(toggle.getAttribute("aria-expanded")).toBe("false"));
      await expect(host.expanded).toBe(false);
      await userEvent.keyboard(" ");
      await waitFor(() => expect(toggle.getAttribute("aria-expanded")).toBe("true"));
      await expect(host.shadowRoot!.activeElement).toBe(toggle);
      await expect(events.map((event) => event.detail.expanded)).toEqual([true, false, true]);
      await expect(events.every((event) => event.bubbles && event.composed)).toBe(true);
    } finally {
      host.removeEventListener("fluid-toggle", onToggle);
    }
  }
};

export const ToolbarRovingFocus: Story = {
  parameters: { quality: { componentTag: "fluid-toolbar" } },
  render: () => html`
    <fluid-toolbar aria-label="Formatting">
      <button>Bold</button>
      <button disabled>Italic</button>
      <button>Underline</button>
    </fluid-toolbar>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-toolbar")!;
    const buttons = host.querySelectorAll<HTMLButtonElement>("button");
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await waitFor(() => expect(document.activeElement).toBe(buttons[2]));
    await expect(buttons[2]!.tabIndex).toBe(0);
  }
};

export const SidebarToggle: Story = {
  parameters: { quality: { componentTag: "fluid-sidebar" } },
  render: () => html`<fluid-sidebar label="Workspace navigation">Navigation</fluid-sidebar>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-sidebar") as HTMLElement & {
      open: boolean;
      toggle: () => void;
    };
    let state = true;
    host.addEventListener("fluid-toggle", (event) => {
      state = (event as CustomEvent<{ open: boolean }>).detail.open;
    });
    host.toggle();
    await waitFor(() => expect(host.open).toBe(false));
    await expect(state).toBe(false);
  }
};

export const LightboxNavigation: Story = {
  parameters: { quality: { componentTag: "fluid-lightbox" } },
  render: () => html`
    <fluid-lightbox loop>
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
        alt="Alpha"
      />
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
        alt="Bravo"
      />
    </fluid-lightbox>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-lightbox")!;
    await userEvent.click(host.querySelectorAll("img")[1]!);
    const image = host.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')!;
    await waitFor(() => expect(image.alt).toBe("Bravo"));
    await userEvent.click(host.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!);
    await waitFor(() => expect(image.alt).toBe("Alpha"));
  }
};

export const AppBarMenuToggle: Story = {
  parameters: { quality: { componentTag: "fluid-app-bar" } },
  render: () =>
    html`<fluid-app-bar menu-button menu-label="Toggle navigation">Fluid</fluid-app-bar>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-app-bar")!;
    let expanded = false;
    host.addEventListener("fluid-menu-toggle", (event) => {
      expanded = (event as CustomEvent<{ expanded: boolean }>).detail.expanded;
    });
    const button = host.shadowRoot!.querySelector<HTMLButtonElement>("button.menu-button")!;
    await userEvent.click(button);
    await waitFor(() => expect(expanded).toBe(true));
  }
};

export const ClickableStepSelection: Story = {
  parameters: { quality: { componentTag: "fluid-steps" } },
  render: () => html`
    <fluid-steps current="1" clickable aria-label="Setup progress">
      <fluid-step>Account</fluid-step>
      <fluid-step>Profile</fluid-step>
      <fluid-step>Finish</fluid-step>
    </fluid-steps>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-steps")!;
    let selected = -1;
    host.addEventListener("fluid-step-change", (event) => {
      selected = (event as CustomEvent<{ index: number }>).detail.index;
    });
    const third = host.querySelectorAll("fluid-step")[2]!;
    await userEvent.click(third.shadowRoot!.querySelector<HTMLButtonElement>("button")!);
    await waitFor(() => expect(selected).toBe(2));
  }
};

export const HotkeyActivation: Story = {
  parameters: { quality: { componentTag: "fluid-hotkey" } },
  render: () => html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-hotkey")!;
    let shortcut = "";
    host.addEventListener("fluid-hotkey", (event) => {
      shortcut = (event as CustomEvent<{ keys: string }>).detail.keys;
    });
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
    await waitFor(() => expect(shortcut).toBe("ctrl+k"));
  }
};

export const AnchorNavigation: Story = {
  parameters: { quality: { componentTag: "fluid-anchor-nav" } },
  render: () => html`
    <section id="interaction-intro">Introduction</section>
    <section id="interaction-details">Details</section>
    <fluid-anchor-nav
      .items=${[
        { id: "interaction-intro", label: "Introduction", level: 2 },
        { id: "interaction-details", label: "Details", level: 2 }
      ]}
    ></fluid-anchor-nav>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-anchor-nav")!;
    const activeChanges: string[] = [];
    host.addEventListener("fluid-active-change", (event) => {
      activeChanges.push((event as CustomEvent<{ id: string }>).detail.id);
    });
    await userEvent.click(
      host.shadowRoot!.querySelector<HTMLAnchorElement>('a[href="#interaction-details"]')!
    );
    await waitFor(() => expect(activeChanges).toContain("interaction-details"));
  }
};

export const BreadcrumbItemActivation: Story = {
  parameters: { quality: { componentTag: "fluid-breadcrumb-item" } },
  render: () => html`
    <fluid-breadcrumb>
      <fluid-breadcrumb-item href="#breadcrumb-account">Account</fluid-breadcrumb-item>
      <fluid-breadcrumb-item current>Settings</fluid-breadcrumb-item>
    </fluid-breadcrumb>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector("fluid-breadcrumb-item")!;
    let activations = 0;
    item.addEventListener("click", () => (activations += 1));
    await userEvent.click(item.shadowRoot!.querySelector<HTMLAnchorElement>("a")!);
    await expect(activations).toBe(1);
  }
};

export const AnimatedImagePlaybackToggle: Story = {
  parameters: { quality: { componentTag: "fluid-animated-image" } },
  render: () => html`
    <fluid-animated-image
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      alt="Animated status"
    ></fluid-animated-image>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-animated-image") as HTMLElement & {
      paused: boolean;
    };
    const control = host.shadowRoot!.querySelector<HTMLButtonElement>('[part="control"]')!;
    await userEvent.click(control);
    await waitFor(() => expect(host.paused).toBe(true));
    await expect(control.getAttribute("aria-label")).toBe("Play animation");
  }
};

export const AudioMuteToggle: Story = {
  parameters: { quality: { componentTag: "fluid-audio" } },
  render: () => html`<fluid-audio label="Sample track"></fluid-audio>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-audio")!;
    const mute = host.shadowRoot!.querySelector<HTMLButtonElement>('[part="mute-button"]')!;
    await userEvent.click(mute);
    await waitFor(() => expect(mute.getAttribute("aria-pressed")).toBe("true"));
    await expect(host.shadowRoot!.querySelector<HTMLAudioElement>("audio")!.muted).toBe(true);
  }
};

export const FileInputKeyboardActivation: Story = {
  parameters: { quality: { componentTag: "fluid-file-input" } },
  render: () => html`<fluid-file-input label="Upload documents"></fluid-file-input>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-file-input")!;
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    let activations = 0;
    input.addEventListener("click", () => (activations += 1));
    const zone = host.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    zone.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(activations).toBe(1));
  }
};

export const DropzoneKeyboardActivation: Story = {
  parameters: { quality: { componentTag: "fluid-dropzone" } },
  render: () => html`<fluid-dropzone label="Upload assets"></fluid-dropzone>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-dropzone")!;
    const input = host.shadowRoot!.querySelector<HTMLInputElement>("input.input")!;
    let activations = 0;
    input.addEventListener("click", () => (activations += 1));
    const zone = host.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await waitFor(() => expect(activations).toBe(1));
  }
};

export const TimeSlotsKeyboardSelection: Story = {
  parameters: { quality: { componentTag: "fluid-time-slots" } },
  render: () => html`
    <fluid-time-slots
      .slots=${[
        {
          start: "2026-06-15T09:00",
          end: "2026-06-15T09:30",
          remaining: 1,
          state: "available"
        },
        {
          start: "2026-06-15T09:30",
          end: "2026-06-15T10:00",
          remaining: 1,
          state: "available"
        }
      ]}
    ></fluid-time-slots>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("fluid-time-slots") as HTMLElement & {
      value: string | null;
    };
    const group = host.shadowRoot!.querySelector<HTMLElement>('[role="radiogroup"]')!;
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await waitFor(() => expect(host.value).toBe("2026-06-15T09:30"));
  }
};
