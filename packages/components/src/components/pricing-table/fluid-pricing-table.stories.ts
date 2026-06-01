import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidPricingTier } from "./fluid-pricing-tier.js";

type Args = Pick<
  FluidPricingTier,
  "name" | "price" | "period" | "featured" | "featuredLabel" | "headingLevel"
>;

const meta: Meta<Args> = {
  title: "Components/Content/Pricing table",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    name: { control: "text" },
    price: { control: "text" },
    period: { control: "text" },
    featured: { control: "boolean" },
    featuredLabel: { control: "text" },
    headingLevel: { control: { type: "number", min: 2, max: 6 } }
  },
  args: {
    name: "Pro",
    price: "$29",
    period: "/mo",
    featured: false,
    featuredLabel: "Most popular",
    headingLevel: 3
  },
  render: (args) => html`
    <fluid-pricing-table style="max-width: 24rem;">
      <fluid-pricing-tier
        name=${args.name}
        price=${args.price}
        period=${args.period}
        ?featured=${args.featured}
        featured-label=${args.featuredLabel}
        heading-level=${args.headingLevel}
      >
        <li>Unlimited projects</li>
        <li>Priority support</li>
        <li>Custom domains</li>
        <fluid-button slot="action" variant="primary">Choose plan</fluid-button>
      </fluid-pricing-tier>
    </fluid-pricing-table>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Featured: Story = {
  args: { featured: true }
};

const tier = (
  name: string,
  price: string,
  features: string[],
  opts: { featured?: boolean; period?: string } = {}
) => html`
  <fluid-pricing-tier
    name=${name}
    price=${price}
    period=${opts.period ?? "/mo"}
    ?featured=${opts.featured ?? false}
  >
    ${features.map((f) => html`<li>${f}</li>`)}
    <fluid-button slot="action" variant=${opts.featured ? "primary" : "secondary"}>
      Choose ${name}
    </fluid-button>
  </fluid-pricing-tier>
`;

export const Table: Story = {
  render: () => html`
    <fluid-pricing-table>
      ${tier("Starter", "$0", ["1 project", "Community support", "1 GB storage"], {
        period: "/mo"
      })}
      ${tier(
        "Pro",
        "$29",
        ["Unlimited projects", "Priority support", "100 GB storage", "Custom domains"],
        { period: "/mo", featured: true }
      )}
      ${tier("Team", "$99", ["Everything in Pro", "SSO", "Audit log", "Dedicated manager"], {
        period: "/mo"
      })}
    </fluid-pricing-table>
  `
};

export const FreePlan: Story = {
  render: () => html`
    <fluid-pricing-table style="max-width: 24rem;">
      <fluid-pricing-tier name="Hobby" price="Free">
        <li>1 project</li>
        <li>Community support</li>
        <fluid-button slot="action" variant="secondary">Get started</fluid-button>
      </fluid-pricing-tier>
    </fluid-pricing-table>
  `
};

export const CustomHeadingLevel: Story = {
  render: () => html`
    <fluid-pricing-table style="max-width: 24rem;">
      <fluid-pricing-tier name="Enterprise" price="Custom" heading-level="2">
        <li>Custom contract</li>
        <li>24/7 support</li>
        <fluid-button slot="action" variant="primary">Contact sales</fluid-button>
      </fluid-pricing-tier>
    </fluid-pricing-table>
  `
};
