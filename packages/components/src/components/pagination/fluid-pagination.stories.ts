import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidPagination } from "./fluid-pagination.js";

type Args = Pick<
  FluidPagination,
  "total" | "totalPages" | "pageSize" | "page" | "siblings" | "label"
>;

const meta: Meta<Args> = {
  title: "Components/Navigation/Pagination",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    total: { control: "number" },
    totalPages: { control: "number" },
    pageSize: { control: "number" },
    page: { control: "number" },
    siblings: { control: "number" },
    label: { control: "text" }
  },
  args: { totalPages: 10, pageSize: 10, page: 1, siblings: 1, label: "Pagination" },
  render: (args) => html`
    <fluid-pagination
      total-pages=${args.totalPages ?? ""}
      page-size=${args.pageSize}
      page=${args.page}
      siblings=${args.siblings}
      label=${args.label}
    ></fluid-pagination>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

/** A short list shows every page with no truncation. */
export const FewPages: Story = {
  args: { totalPages: 4, page: 2 }
};

/** A long list truncates with an ellipsis on either side of the window. */
export const ManyPages: Story = {
  args: { totalPages: 20, page: 10 }
};

/** Previous is disabled on the first page. */
export const FirstPage: Story = {
  args: { totalPages: 12, page: 1 }
};

/** Next is disabled on the last page. */
export const LastPage: Story = {
  args: { totalPages: 12, page: 12 }
};

/** Widen the sibling window so more page numbers stay visible. */
export const WiderWindow: Story = {
  args: { totalPages: 20, page: 10, siblings: 2 }
};

/** Derive the page count from an item total and a page size. */
export const FromItemTotal: Story = {
  render: () => html`
    <fluid-pagination total="195" page-size="20" page="3"></fluid-pagination>
  `
};

/** All states side by side. */
export const Overview: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4);">
      <fluid-pagination total-pages="5" page="1"></fluid-pagination>
      <fluid-pagination total-pages="10" page="5"></fluid-pagination>
      <fluid-pagination total-pages="20" page="10"></fluid-pagination>
      <fluid-pagination total-pages="20" page="20"></fluid-pagination>
    </div>
  `
};
