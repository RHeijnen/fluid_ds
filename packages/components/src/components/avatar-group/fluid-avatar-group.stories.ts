import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../avatar/define.js";
import type { FluidAvatarGroup } from "./fluid-avatar-group.js";

type Args = Pick<FluidAvatarGroup, "size" | "max" | "label">;

const meta: Meta<Args> = {
  title: "Components/Content/Avatar group",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg", "xl"]
    },
    max: { control: { type: "number", min: 0 } },
    label: { control: "text" }
  },
  args: { size: "md", max: 0, label: "" },
  render: (args) => html`
    <fluid-avatar-group size=${args.size} max=${args.max} label=${args.label}>
      <fluid-avatar label="Ada Lovelace"></fluid-avatar>
      <fluid-avatar label="Grace Hopper"></fluid-avatar>
      <fluid-avatar label="Alan Turing"></fluid-avatar>
      <fluid-avatar label="Katherine Johnson"></fluid-avatar>
      <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
    </fluid-avatar-group>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithOverflow: Story = {
  args: { max: 3 },
  render: (args) => html`
    <fluid-avatar-group size=${args.size} max=${args.max}>
      <fluid-avatar label="Ada Lovelace"></fluid-avatar>
      <fluid-avatar label="Grace Hopper"></fluid-avatar>
      <fluid-avatar label="Alan Turing"></fluid-avatar>
      <fluid-avatar label="Katherine Johnson"></fluid-avatar>
      <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
      <fluid-avatar label="Margaret Hamilton"></fluid-avatar>
    </fluid-avatar-group>
  `
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap: var(--fluid-space-6);">
      ${(["xs", "sm", "md", "lg", "xl"] as const).map(
        (size) => html`
          <fluid-avatar-group size=${size} max="3">
            <fluid-avatar label="Ada Lovelace"></fluid-avatar>
            <fluid-avatar label="Grace Hopper"></fluid-avatar>
            <fluid-avatar label="Alan Turing"></fluid-avatar>
            <fluid-avatar label="Katherine Johnson"></fluid-avatar>
            <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
          </fluid-avatar-group>
        `
      )}
    </div>
  `
};

export const WithImages: Story = {
  args: { max: 4 },
  render: (args) => html`
    <fluid-avatar-group size=${args.size} max=${args.max}>
      <fluid-avatar
        label="Ada Lovelace"
        image="https://i.pravatar.cc/80?img=1"
      ></fluid-avatar>
      <fluid-avatar
        label="Grace Hopper"
        image="https://i.pravatar.cc/80?img=5"
      ></fluid-avatar>
      <fluid-avatar
        label="Alan Turing"
        image="https://i.pravatar.cc/80?img=12"
      ></fluid-avatar>
      <fluid-avatar
        label="Katherine Johnson"
        image="https://i.pravatar.cc/80?img=20"
      ></fluid-avatar>
      <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
      <fluid-avatar label="Margaret Hamilton"></fluid-avatar>
    </fluid-avatar-group>
  `
};

export const CustomLabel: Story = {
  args: { max: 3, label: "Project reviewers" },
  render: (args) => html`
    <fluid-avatar-group size=${args.size} max=${args.max} label=${args.label}>
      <fluid-avatar label="Ada Lovelace"></fluid-avatar>
      <fluid-avatar label="Grace Hopper"></fluid-avatar>
      <fluid-avatar label="Alan Turing"></fluid-avatar>
      <fluid-avatar label="Katherine Johnson"></fluid-avatar>
    </fluid-avatar-group>
  `
};
