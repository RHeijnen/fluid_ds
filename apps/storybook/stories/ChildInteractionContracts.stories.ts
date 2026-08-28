import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "@fluid-ds/components/define/dropdown";
import "@fluid-ds/components/define/list";
import "@fluid-ds/components/define/nav-list";
import "@fluid-ds/components/define/steps";

const meta: Meta = {
  title: "Quality/Child interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

export const DropdownItemContract: Story = {
  parameters: { quality: { componentTag: "fluid-dropdown-item" } },
  render: () => html`
    <fluid-dropdown>
      <button slot="trigger">Project actions</button>
      <fluid-dropdown-item value="blocked" disabled>Unavailable</fluid-dropdown-item>
      <fluid-dropdown-item value="pin" type="checkbox">Pin project</fluid-dropdown-item>
      <fluid-dropdown-item type="separator"></fluid-dropdown-item>
      <fluid-dropdown-item value="archive">Archive project</fluid-dropdown-item>
    </fluid-dropdown>
  `,
  play: async ({ canvasElement }) => {
    const dropdown = canvasElement.querySelector("fluid-dropdown")!;
    const trigger = dropdown.querySelector("button")!;
    const menu = dropdown.shadowRoot!.querySelector<HTMLElement>('[role="menu"]')!;
    const [disabled, pin, separator, archive] = [
      ...dropdown.querySelectorAll("fluid-dropdown-item")
    ];
    const events: CustomEvent<{ value: string; item: Element }>[] = [];
    const listener = (event: Event) =>
      events.push(event as CustomEvent<{ value: string; item: Element }>);
    dropdown.addEventListener("fluid-select", listener);
    try {
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(dropdown.shadowRoot!.activeElement).toBe(menu));
      await expect(pin!.getAttribute("role")).toBe("menuitemcheckbox");
      await expect(pin!.getAttribute("aria-checked")).toBe("false");
      await expect(pin!.hasAttribute("active")).toBe(true);
      await expect(separator!.getAttribute("role")).toBe("separator");
      await userEvent.keyboard(" ");
      await waitFor(() => expect(pin!.getAttribute("aria-checked")).toBe("true"));
      await expect(trigger.getAttribute("aria-expanded")).toBe("true");
      await userEvent.click(disabled!);
      await expect(events.length).toBe(1);
      menu.focus();
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(archive!.hasAttribute("active")).toBe(true));
      await expect(separator!.hasAttribute("active")).toBe(false);
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
      await expect(document.activeElement).toBe(trigger);
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(dropdown.shadowRoot!.activeElement).toBe(menu));
      await userEvent.click(pin!);
      await waitFor(() => expect(pin!.getAttribute("aria-checked")).toBe("false"));
      menu.focus();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
      await expect(events.map((event) => event.detail.value)).toEqual(["pin", "archive", "pin"]);
      await expect(events.map((event) => event.detail.item)).toEqual([pin, archive, pin]);
      await expect(
        events.every((event) => event.target === dropdown && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      dropdown.removeEventListener("fluid-select", listener);
    }
  }
};

export const ListItemContract: Story = {
  parameters: { quality: { componentTag: "fluid-list-item" } },
  render: () => html`
    <fluid-list label="Projects">
      <fluid-list-item interactive>
        Alpha
        <button slot="trailing">Archive Alpha</button>
      </fluid-list-item>
      <fluid-list-item interactive disabled>Unavailable project</fluid-list-item>
      <fluid-list-item href="#project-details">Project details</fluid-list-item>
    </fluid-list>
  `,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("fluid-list")!;
    const [alpha, disabled, details] = [...list.querySelectorAll("fluid-list-item")];
    const row = alpha!.shadowRoot!.querySelector("button")!;
    const trailing = alpha!.querySelector("button")!;
    const disabledRow = disabled!.shadowRoot!.querySelector("button")!;
    const link = details!.shadowRoot!.querySelector("a")!;
    const selections: Event[] = [];
    const links: Event[] = [];
    const selectionListener = (event: Event) => selections.push(event);
    // Keep the fixture in place while verifying native anchor activation.
    const linkListener = (event: Event) => {
      event.preventDefault();
      links.push(event);
    };
    list.addEventListener("fluid-select", selectionListener);
    link.addEventListener("click", linkListener);
    try {
      alpha!.focus();
      await expect(alpha!.shadowRoot!.activeElement).toBe(row);
      await userEvent.keyboard("{Enter} ");
      await expect(selections.length).toBe(2);
      await userEvent.click(row);
      await userEvent.click(trailing);
      await expect(selections.length).toBe(3);
      await expect(
        alpha!.shadowRoot!.querySelector('slot[name="trailing"]')!.closest("button,a")
      ).toBeNull();
      await expect(disabledRow.disabled).toBe(true);
      await userEvent.click(disabledRow);
      await expect(selections.length).toBe(3);
      link.focus();
      await userEvent.keyboard(" ");
      await expect(links.length).toBe(0);
      await userEvent.keyboard("{Enter}");
      await expect(links.length).toBe(1);
      await expect(link.getAttribute("href")).toBe("#project-details");
      await expect(selections.length).toBe(3);
      await expect(
        selections.every((event) => event.target === alpha && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      list.removeEventListener("fluid-select", selectionListener);
      link.removeEventListener("click", linkListener);
    }
  }
};

export const NavItemContract: Story = {
  parameters: { quality: { componentTag: "fluid-nav-item" } },
  render: () => html`
    <fluid-nav-list label="Project sections">
      <fluid-nav-item href="#overview" current>Overview</fluid-nav-item>
      <fluid-nav-item href="#activity">Activity</fluid-nav-item>
      <fluid-nav-item>No destination</fluid-nav-item>
    </fluid-nav-list>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector("fluid-nav-list")!;
    const [overview, activity, inert] = [...nav.querySelectorAll("fluid-nav-item")];
    const link = activity!.shadowRoot!.querySelector("a")!;
    const clicks: Event[] = [];
    const listener = (event: Event) => {
      event.preventDefault();
      clicks.push(event);
    };
    link.addEventListener("click", listener);
    try {
      await expect(overview!.shadowRoot!.querySelector("a")!.getAttribute("aria-current")).toBe(
        "page"
      );
      await expect(link.hasAttribute("aria-current")).toBe(false);
      activity!.focus();
      await expect(activity!.shadowRoot!.activeElement).toBe(link);
      await userEvent.keyboard(" ");
      await expect(clicks.length).toBe(0);
      await userEvent.keyboard("{Enter}");
      await userEvent.click(link);
      await expect(clicks.length).toBe(2);
      await expect(link.getAttribute("href")).toBe("#activity");
      overview!.current = false;
      activity!.current = true;
      await waitFor(() => expect(link.getAttribute("aria-current")).toBe("page"));
      await expect(overview!.shadowRoot!.querySelector("a")!.hasAttribute("aria-current")).toBe(
        false
      );
      await expect(inert!.shadowRoot!.querySelector("a")!.hasAttribute("href")).toBe(false);
      await expect(clicks.every((event) => event.bubbles && event.composed)).toBe(true);
    } finally {
      link.removeEventListener("click", listener);
    }
  }
};

export const StepContract: Story = {
  parameters: { quality: { componentTag: "fluid-step" } },
  render: () => html`
    <fluid-steps clickable current="1" aria-label="Checkout">
      <fluid-step>Account</fluid-step>
      <fluid-step>Delivery</fluid-step>
      <fluid-step>Payment</fluid-step>
    </fluid-steps>
  `,
  play: async ({ canvasElement }) => {
    const steps = canvasElement.querySelector("fluid-steps")!;
    const [account, delivery, payment] = [...steps.querySelectorAll("fluid-step")];
    const events: CustomEvent<{ index: number }>[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent<{ index: number }>);
    steps.addEventListener("fluid-step-change", listener);
    try {
      payment!.focus();
      await expect(payment!.shadowRoot!.activeElement).toBe(
        payment!.shadowRoot!.querySelector("button")
      );
      await userEvent.keyboard("{Enter}");
      await expect(events.map((event) => event.detail.index)).toEqual([2]);
      // Controlled contract: activation requests a change but the consumer owns current.
      await expect(steps.current).toBe(1);
      await expect(delivery!.getAttribute("aria-current")).toBe("step");
      steps.current = events[0]!.detail.index;
      await waitFor(() => expect(payment!.getAttribute("aria-current")).toBe("step"));
      await expect(delivery!.hasAttribute("aria-current")).toBe(false);
      await expect(account!.state).toBe("complete");
      account!.focus();
      await userEvent.keyboard(" ");
      await userEvent.click(delivery!.shadowRoot!.querySelector("button")!);
      await expect(events.map((event) => event.detail.index)).toEqual([2, 0, 1]);
      await expect(
        events.every((event) => event.target === steps && event.bubbles && event.composed)
      ).toBe(true);
      steps.clickable = false;
      await waitFor(() => expect(account!.shadowRoot!.querySelector("button")).toBeNull());
      await userEvent.click(account!);
      await expect(events.length).toBe(3);
      await expect(payment!.getAttribute("aria-current")).toBe("step");
    } finally {
      steps.removeEventListener("fluid-step-change", listener);
    }
  }
};

export const NavListContract: Story = {
  parameters: { quality: { componentTag: "fluid-nav-list" } },
  render: () => html`
    <fluid-nav-list label="Workspace navigation">
      <fluid-nav-item href="#workspace">Workspace</fluid-nav-item>
      <fluid-nav-item href="#members">Members</fluid-nav-item>
    </fluid-nav-list>
    <fluid-nav-list label="Account navigation">
      <fluid-nav-item href="#profile">Profile</fluid-nav-item>
    </fluid-nav-list>
  `,
  play: async ({ canvasElement }) => {
    const [workspace, account] = [...canvasElement.querySelectorAll("fluid-nav-list")];
    const destinations: string[] = [];
    const recordNavigation = (event: Event) => {
      const anchor = event.composedPath().find((node) => node instanceof HTMLAnchorElement) as
        | HTMLAnchorElement
        | undefined;
      if (!anchor) return;
      event.preventDefault();
      destinations.push(anchor.getAttribute("href")!);
    };
    canvasElement.addEventListener("click", recordNavigation);
    const added = document.createElement("fluid-nav-item");
    added.href = "#settings";
    added.textContent = "Settings";
    try {
      await expect(workspace!.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).toBe(
        "Workspace navigation"
      );
      await expect(account!.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).toBe(
        "Account navigation"
      );
      workspace!.append(added);
      await added.updateComplete;
      added.focus();
      await userEvent.keyboard("{Enter}");
      await expect(destinations).toEqual(["#settings"]);
      await expect(workspace!.querySelectorAll("fluid-nav-item").length).toBe(3);
      await expect(account!.querySelectorAll("fluid-nav-item").length).toBe(1);
      workspace!.label = "Project navigation";
      await waitFor(() =>
        expect(workspace!.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).toBe(
          "Project navigation"
        )
      );
      await expect(account!.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).toBe(
        "Account navigation"
      );
      await userEvent.click(
        account!.querySelector("fluid-nav-item")!.shadowRoot!.querySelector("a")!
      );
      await expect(destinations).toEqual(["#settings", "#profile"]);
      added.remove();
      await expect(workspace!.querySelectorAll("fluid-nav-item").length).toBe(2);
    } finally {
      canvasElement.removeEventListener("click", recordNavigation);
      added.remove();
    }
  }
};
