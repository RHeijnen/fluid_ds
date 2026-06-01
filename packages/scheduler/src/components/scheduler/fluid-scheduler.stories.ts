import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { Availability } from "../../internal/availability.js";

/** A vet clinic: open Mon-Fri (split for lunch), Sat mornings, closed Sun. */
const vetClinic: Availability = {
  weekly: {
    1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    2: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    3: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    4: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    5: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "16:00" }],
    6: [{ start: "09:00", end: "12:00" }]
  },
  slotMinutes: 20,
  minNoticeMinutes: 120,
  maxAdvanceDays: 45
};

const meta: Meta = {
  title: "Scheduler/Scheduler",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-scheduler
      .availability=${vetClinic}
      time-format="24h"
      style="max-width: 40rem;"
      @fluid-change=${(e: Event) => console.log("booked", (e as CustomEvent).detail)}
    ></fluid-scheduler>
  `
};

export default meta;
type Story = StoryObj;

export const VetClinic: Story = {};

export const TwelveHour: Story = {
  render: () => html`
    <fluid-scheduler .availability=${vetClinic} time-format="12h" style="max-width: 40rem;"></fluid-scheduler>
  `
};

export const GroupClasses: Story = {
  render: () => html`
    <fluid-scheduler
      style="max-width: 40rem;"
      .availability=${{
        weekly: {
          1: [{ start: "18:00", end: "20:00" }],
          3: [{ start: "18:00", end: "20:00" }],
          6: [{ start: "10:00", end: "12:00" }]
        },
        slotMinutes: 60,
        capacity: 8,
        maxAdvanceDays: 30
      } as Availability}
    ></fluid-scheduler>
  `
};

export const Loading: Story = {
  render: () => html`
    <fluid-scheduler .availability=${vetClinic} loading style="max-width: 40rem;"></fluid-scheduler>
  `
};

export const Compact: Story = {
  render: () => html`
    <fluid-scheduler .availability=${vetClinic} size="sm" style="max-width: 34rem;"></fluid-scheduler>
  `
};
