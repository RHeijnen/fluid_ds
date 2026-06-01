import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { Slot } from "../../internal/availability.js";

const SLOTS: Slot[] = [
  { start: "2026-06-15T09:00", end: "2026-06-15T09:30", remaining: 1, state: "available" },
  { start: "2026-06-15T09:30", end: "2026-06-15T10:00", remaining: 1, state: "available" },
  { start: "2026-06-15T10:00", end: "2026-06-15T10:30", remaining: 0, state: "full" },
  { start: "2026-06-15T10:30", end: "2026-06-15T11:00", remaining: 1, state: "available" },
  { start: "2026-06-15T11:00", end: "2026-06-15T11:30", remaining: 1, state: "available" },
  { start: "2026-06-15T11:30", end: "2026-06-15T12:00", remaining: 0, state: "past" }
];

const meta: Meta = {
  title: "Scheduler/Time slots",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-time-slots date="2026-06-15" .slots=${SLOTS} style="max-width: 24rem;"></fluid-time-slots>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const WithSelection: Story = {
  render: () => html`
    <fluid-time-slots date="2026-06-15" .slots=${SLOTS} value="2026-06-15T09:30" style="max-width: 24rem;"></fluid-time-slots>
  `
};

export const TwelveHour: Story = {
  render: () => html`
    <fluid-time-slots date="2026-06-15" .slots=${SLOTS} time-format="12h" style="max-width: 24rem;"></fluid-time-slots>
  `
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; gap: 1.5rem; max-width: 24rem;">
      <fluid-time-slots size="sm" date="2026-06-15" .slots=${SLOTS} no-heading></fluid-time-slots>
      <fluid-time-slots size="md" date="2026-06-15" .slots=${SLOTS} no-heading></fluid-time-slots>
      <fluid-time-slots size="lg" date="2026-06-15" .slots=${SLOTS} no-heading></fluid-time-slots>
    </div>
  `
};

export const GeneratedFromAvailability: Story = {
  render: () => html`
    <fluid-time-slots
      date="2030-01-07"
      .availability=${{
        weekly: { 1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "16:00" }] },
        slotMinutes: 30
      }}
      style="max-width: 24rem;"
    ></fluid-time-slots>
  `
};

export const Empty: Story = {
  render: () => html`
    <fluid-time-slots date="2026-06-15" .slots=${[]} style="max-width: 24rem;"></fluid-time-slots>
  `
};
