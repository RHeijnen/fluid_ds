import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, fireEvent, userEvent, waitFor, within } from "@storybook/test";
import { html } from "lit";
import "../../../packages/calendar/src/components/event-calendar/define.js";
import "../../../packages/scheduler/src/components/scheduler/define.js";
import "../../../packages/scheduler/src/components/availability-editor/define.js";
import type { FluidEventCalendar } from "../../../packages/calendar/src/components/event-calendar/fluid-event-calendar.js";
import type { FluidScheduler } from "../../../packages/scheduler/src/components/scheduler/fluid-scheduler.js";
import type { FluidAvailabilityEditor } from "../../../packages/scheduler/src/components/availability-editor/fluid-availability-editor.js";
import type { Availability } from "../../../packages/scheduler/src/internal/availability.js";

const meta: Meta = {
  title: "Quality/Calendar interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;
const allDays: Availability = {
  weekly: Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6].map((day) => [day, [{ start: "09:00", end: "12:00" }]])
  ),
  slotMinutes: 60
};
const seed: Availability = {
  weekly: { 1: [{ start: "09:00", end: "17:00" }] },
  slotMinutes: 30,
  stepMinutes: 15,
  bufferMinutes: 5,
  minNoticeMinutes: 90,
  exceptions: [{ date: "2035-12-25", closed: true }]
};
const renderEvents = () => html`
  <fluid-event-calendar
    month="2026-06"
    locale="en-US"
    max-per-day="2"
    .events=${[
      { id: "release", date: "2026-06-10", title: "Release" },
      { id: "review", date: "2026-06-10", title: "Review" },
      { id: "retro", date: "2026-06-10", title: "Retrospective" }
    ]}
  ></fluid-event-calendar>
  <button type="button">After calendar</button>
`;
const renderScheduler = () => html`
  <form>
    <button type="button">Before scheduler</button>
    <fluid-scheduler
      name="appointment"
      aria-label="Appointment"
      locale="en-GB"
      value="2035-06-18T09:00"
      min="2035-06-01"
      max="2035-07-31"
      .availability=${allDays}
      .bookings=${[{ start: "2035-06-18T10:00" }]}
    ></fluid-scheduler>
    <button type="reset">Reset appointment</button>
  </form>
`;
const renderEditor = () =>
  html`<fluid-availability-editor
    locale="en-US"
    .availability=${seed}
  ></fluid-availability-editor>`;

export const EventCalendarContract: Story = {
  parameters: { quality: { componentTag: "fluid-event-calendar" } },
  render: renderEvents,
  play: async ({ canvasElement }) => {
    const calendar = canvasElement.querySelector<FluidEventCalendar>("fluid-event-calendar")!;
    await calendar.updateComplete;
    const root = calendar.shadowRoot!;
    const days: string[] = [];
    const events: string[] = [];
    const months: string[] = [];
    const onDay = (event: Event) => days.push((event as CustomEvent).detail.date);
    const onEvent = (event: Event) => {
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      const detail = (event as CustomEvent).detail;
      expect(detail.event.id).toBe(detail.id);
      events.push(detail.id);
    };
    const onMonth = (event: Event) => months.push((event as CustomEvent).detail.month);
    calendar.addEventListener("fluid-day-click", onDay);
    calendar.addEventListener("fluid-event-click", onEvent);
    calendar.addEventListener("fluid-month-change", onMonth);
    try {
      const day = root.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
      day.focus();
      await userEvent.keyboard("{F2}");
      const release = within(root.querySelector<HTMLElement>('[part="base"]')!).getByRole(
        "button",
        { name: "Release" }
      );
      await expect(root.activeElement).toBe(release);
      await userEvent.keyboard("{Enter}");
      await expect(events).toEqual(["release"]);
      await expect(days).toEqual([]);
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard(" ");
      await expect(events).toEqual(["release", "review"]);
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Enter}");
      await expect(days).toEqual(["2026-06-10"]);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(root.activeElement).toBe(day));
      await userEvent.keyboard("{PageDown}");
      await waitFor(() => expect(root.activeElement?.getAttribute("data-iso")).toBe("2026-07-10"));
      await expect(months).toEqual(["2026-07"]);
      await userEvent.click(
        within(root.querySelector<HTMLElement>('[part="base"]')!).getByRole("button", {
          name: "Previous month"
        })
      );
      await waitFor(() => expect(calendar.month).toBe("2026-06"));
      await expect(months).toEqual(["2026-07", "2026-06"]);
      await expect(root.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    } finally {
      calendar.removeEventListener("fluid-day-click", onDay);
      calendar.removeEventListener("fluid-event-click", onEvent);
      calendar.removeEventListener("fluid-month-change", onMonth);
    }
  }
};

export const SchedulerBookingContract: Story = {
  parameters: { quality: { componentTag: "fluid-scheduler" } },
  render: renderScheduler,
  play: async ({ canvasElement }) => {
    const scheduler = canvasElement.querySelector<FluidScheduler>("fluid-scheduler")!;
    await scheduler.updateComplete;
    const slots = scheduler.shadowRoot!.querySelector("fluid-time-slots") as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await slots.updateComplete;
    const radios = within(slots.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!);
    const changes: CustomEvent[] = [];
    const ranges: unknown[] = [];
    const onChange = (event: Event) => changes.push(event as CustomEvent);
    const onRange = (event: Event) => ranges.push((event as CustomEvent).detail);
    scheduler.addEventListener("fluid-change", onChange);
    scheduler.addEventListener("fluid-range-change", onRange);
    try {
      await expect(radios.getByRole("radio", { name: "10:00, unavailable" })).toBeDisabled();
      radios.getByRole("radio", { name: "9:00" }).focus();
      await userEvent.keyboard("{End}{Enter}");
      await waitFor(() => expect(scheduler.value).toBe("2035-06-18T11:00"));
      await expect(changes).toHaveLength(1);
      await expect(changes[0]!.detail).toMatchObject({
        value: "2035-06-18T11:00",
        start: "2035-06-18T11:00",
        end: "2035-06-18T12:00"
      });
      await expect(changes[0]!.bubbles).toBe(true);
      await expect(changes[0]!.composed).toBe(true);
      await expect(new FormData(canvasElement.querySelector("form")!).get("appointment")).toBe(
        scheduler.value
      );
      scheduler.loading = true;
      await scheduler.updateComplete;
      await slots.updateComplete;
      await expect(radios.getByRole("radio", { name: "9:00" })).toBeDisabled();
      scheduler.loading = false;
      await scheduler.updateComplete;
      const calendar = scheduler.shadowRoot!.querySelector("fluid-calendar")!;
      await userEvent.click(
        within(calendar.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!).getByRole(
          "button",
          { name: "Next month" }
        )
      );
      await waitFor(() => expect(ranges).toEqual([{ start: "2035-07-01", end: "2035-07-31" }]));
      const parent = scheduler.parentElement!;
      scheduler.remove();
      parent.insertBefore(scheduler, parent.querySelector('button[type="reset"]'));
      await userEvent.click(
        within(canvasElement).getByRole("button", { name: "Reset appointment" })
      );
      await waitFor(() => expect(scheduler.value).toBe("2035-06-18T09:00"));
      await expect(new FormData(canvasElement.querySelector("form")!).get("appointment")).toBe(
        "2035-06-18T09:00"
      );
    } finally {
      scheduler.removeEventListener("fluid-change", onChange);
      scheduler.removeEventListener("fluid-range-change", onRange);
    }
  }
};

export const AvailabilityEditingContract: Story = {
  parameters: { quality: { componentTag: "fluid-availability-editor" } },
  render: renderEditor,
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector<FluidAvailabilityEditor>(
      "fluid-availability-editor"
    )!;
    await editor.updateComplete;
    const root = editor.shadowRoot!;
    const monday = root.querySelector("fluid-switch") as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await monday.updateComplete;
    const toggle = monday.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const changes: Availability[] = [];
    const onChange = (event: Event) => {
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect((event as CustomEvent).detail.availability).toBeDefined();
      changes.push((event as CustomEvent).detail.availability);
    };
    editor.addEventListener("fluid-change", onChange);
    try {
      toggle.focus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(changes).toHaveLength(1));
      await expect(changes[0]!.weekly[1]).toBeUndefined();
      const parent = editor.parentElement!;
      editor.remove();
      parent.append(editor);
      await editor.updateComplete;
      await expect(toggle.checked).toBe(false);
      toggle.focus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(changes).toHaveLength(2));
      await expect(changes[1]).toMatchObject({
        slotMinutes: 30,
        stepMinutes: 15,
        bufferMinutes: 5,
        minNoticeMinutes: 90
      });
      await expect(changes[1]!.weekly[1]).toEqual([{ start: "09:00", end: "17:00" }]);
      const time = root.querySelector<HTMLInputElement>('input[type="time"]')!;
      // userEvent.clear cannot resolve focus inside a shadow-root time input.
      // Exercise the change contract here; Playwright covers native fill + Tab.
      fireEvent.change(time, { target: { value: "18:00" } });
      await waitFor(() => expect(time).toHaveAttribute("aria-invalid", "true"));
      await expect(changes).toHaveLength(2);
      fireEvent.change(time, { target: { value: "08:30" } });
      await waitFor(() => expect(changes).toHaveLength(3));
      await expect(changes[2]!.weekly[1]![0]!.start).toBe("08:30");
      await userEvent.click(
        within(root.querySelector<HTMLElement>('[part="base"]')!).getByRole("button", {
          name: "Remove closed date"
        })
      );
      await waitFor(() => expect(changes).toHaveLength(4));
      await expect(changes[3]!.exceptions).toBeUndefined();
      await expect(seed.weekly[1]![0]!.start).toBe("09:00");
    } finally {
      editor.removeEventListener("fluid-change", onChange);
    }
  }
};

export const NativeEventFixture: Story = { tags: ["!interaction-contract"], render: renderEvents };
export const NativeSchedulerFixture: Story = {
  tags: ["!interaction-contract"],
  render: renderScheduler
};
export const NativeAvailabilityFixture: Story = {
  tags: ["!interaction-contract"],
  render: renderEditor
};
