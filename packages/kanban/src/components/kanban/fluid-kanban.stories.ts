import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { KanbanColumn } from "./fluid-kanban.js";

const board: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "c1", title: "Draft the spec", description: "Outline scope and goals." },
      { id: "c2", title: "Set up CI" },
      { id: "c3", title: "Design tokens", description: "Pick the palette." }
    ]
  },
  {
    id: "doing",
    title: "In progress",
    cards: [
      { id: "c4", title: "Build the board", description: "Drag and drop plus keyboard." }
    ]
  },
  {
    id: "done",
    title: "Done",
    cards: [{ id: "c5", title: "Kickoff meeting" }]
  }
];

const meta: Meta = {
  title: "Kanban/Board",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: (args) => html`
    <fluid-kanban .columns=${args["columns"]}></fluid-kanban>
  `,
  args: { columns: board }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const SingleColumn: Story = {
  args: {
    columns: [
      {
        id: "backlog",
        title: "Backlog",
        cards: [
          { id: "b1", title: "Research competitors" },
          { id: "b2", title: "Write user stories", description: "One per persona." }
        ]
      }
    ]
  }
};

export const EmptyColumns: Story = {
  args: {
    columns: [
      { id: "todo", title: "To do", cards: [{ id: "x1", title: "First task" }] },
      { id: "doing", title: "In progress", cards: [] },
      { id: "done", title: "Done", cards: [] }
    ]
  }
};
