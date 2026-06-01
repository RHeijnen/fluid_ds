import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { CalendarEvent } from "./fluid-event-calendar.js";

const month = "2026-06";

const sample: CalendarEvent[] = [
  { id: "1", date: "2026-06-03", title: "Standup", tone: "accent" },
  { id: "2", date: "2026-06-03", title: "Design review", tone: "success" },
  { id: "3", date: "2026-06-10", title: "Release cut", tone: "warning" },
  { id: "4", date: "2026-06-10", title: "Retro", tone: "accent" },
  { id: "5", date: "2026-06-10", title: "1:1", tone: "accent" },
  { id: "6", date: "2026-06-10", title: "Incident review", tone: "danger" },
  { id: "7", date: "2026-06-18", title: "Planning", tone: "accent" },
  { id: "8", date: "2026-06-25", title: "Demo day", tone: "success" }
];

const meta: Meta = {
  title: "Calendar/Event calendar",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: (args) => html`
    <fluid-event-calendar
      style="max-width: 44rem;"
      .month=${args["month"]}
      .events=${args["events"]}
      week-start=${args["weekStart"]}
      max-per-day=${args["maxPerDay"]}
    ></fluid-event-calendar>
  `,
  args: {
    month,
    events: sample,
    weekStart: 1,
    maxPerDay: 3
  },
  argTypes: {
    month: { control: "text", description: 'Visible month as "YYYY-MM".' },
    weekStart: { control: { type: "number", min: 0, max: 6 }, description: "First day of week (0 Sun - 6 Sat)." },
    maxPerDay: { control: { type: "number", min: 0, max: 8 }, description: 'Chips per day before "+N more".' },
    locale: { control: "text", description: "BCP-47 locale for labels." }
  }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Empty: Story = {
  args: { events: [] }
};

export const WeekStartsSunday: Story = {
  args: { weekStart: 0 }
};

export const DutchLocale: Story = {
  render: () => html`
    <fluid-event-calendar
      style="max-width: 44rem;"
      .month=${month}
      .events=${sample}
      locale="nl-NL"
    ></fluid-event-calendar>
  `
};

export const Overflow: Story = {
  args: { maxPerDay: 2 }
};
