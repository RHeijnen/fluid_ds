import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../scheduler/define.js";
import type { Availability } from "../../internal/availability.js";

const seed: Availability = {
  weekly: {
    1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    2: [{ start: "09:00", end: "17:00" }],
    3: [{ start: "09:00", end: "17:00" }],
    4: [{ start: "09:00", end: "17:00" }],
    5: [{ start: "09:00", end: "16:00" }]
  },
  slotMinutes: 30,
  minNoticeMinutes: 120,
  maxAdvanceDays: 45
};

const meta: Meta = {
  title: "Scheduler/Availability editor",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-availability-editor
      .availability=${seed}
      style="max-width: 40rem;"
      @fluid-change=${(e: Event) => console.log("availability", (e as CustomEvent).detail.availability)}
    ></fluid-availability-editor>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Empty: Story = {
  render: () => html`<fluid-availability-editor style="max-width: 40rem;"></fluid-availability-editor>`
};

/** The owner editor wired live to the visitor scheduler: edit hours on the left,
 *  the bookable calendar on the right updates instantly. */
export const OwnerAndVisitor: Story = {
  render: () => html`
    <div style="display: grid; gap: 2rem; max-width: 44rem;">
      <fluid-availability-editor
        .availability=${seed}
        @fluid-change=${(e: Event) => {
          const sched = document.querySelector<HTMLElement & { availability: Availability }>("#wired-scheduler");
          if (sched) sched.availability = (e as CustomEvent).detail.availability;
        }}
      ></fluid-availability-editor>
      <hr style="width: 100%; border: none; border-top: 1px solid var(--fluid-border-default);" />
      <fluid-scheduler id="wired-scheduler" .availability=${seed}></fluid-scheduler>
    </div>
  `
};
