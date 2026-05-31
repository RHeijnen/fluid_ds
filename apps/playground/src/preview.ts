import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { themeStore } from "./store.js";
import "./preview-card.js";

/**
 * Live component gallery. This element is the "preview root", the theme store
 * applies all token overrides as inline CSS variables on its host element so
 * cascading custom properties reach every nested component.
 */
@customElement("component-preview")
export class ComponentPreview extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--fluid-space-4);
    }

    h3 {
      margin: 0;
      font-size: var(--fluid-font-size-md);
      font-weight: var(--fluid-font-weight-semibold);
    }

    .demo {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-3);
      align-items: flex-start;
    }
  `;

  @query(".grid") private grid!: HTMLElement;

  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = themeStore.subscribe(() => {
      if (this.grid) themeStore.applyTo(this.grid);
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  override firstUpdated(): void {
    themeStore.applyTo(this.grid);
  }

  override render(): TemplateResult {
    return html`
      <div class="grid">
        <fluid-card>
          <h3 slot="header">Button</h3>
          <div class="demo">
            <fluid-button>Primary</fluid-button>
            <fluid-button variant="secondary">Secondary</fluid-button>
            <fluid-button variant="ghost">Ghost</fluid-button>
            <fluid-button disabled>Disabled</fluid-button>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Input</h3>
          <div class="demo">
            <fluid-input placeholder="Type here…" aria-label="Demo"></fluid-input>
            <fluid-input value="Filled value" aria-label="Filled"></fluid-input>
            <fluid-input disabled value="Disabled" aria-label="Disabled"></fluid-input>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Switch</h3>
          <div class="demo">
            <fluid-switch>Wifi</fluid-switch>
            <fluid-switch checked>Bluetooth</fluid-switch>
            <fluid-switch disabled>Disabled</fluid-switch>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Select</h3>
          <fluid-select aria-label="Country" value="nl">
            <fluid-option value="nl">Netherlands</fluid-option>
            <fluid-option value="be">Belgium</fluid-option>
            <fluid-option value="de">Germany</fluid-option>
            <fluid-option value="fr">France</fluid-option>
          </fluid-select>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Slider</h3>
          <fluid-slider value="40" show-value aria-label="Demo"></fluid-slider>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Segmented control</h3>
          <fluid-segmented-control value="grid" aria-label="View">
            <fluid-segment value="list">List</fluid-segment>
            <fluid-segment value="grid">Grid</fluid-segment>
            <fluid-segment value="kanban">Kanban</fluid-segment>
          </fluid-segmented-control>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Badge</h3>
          <div class="demo" style="flex-direction: row; flex-wrap: wrap;">
            <fluid-badge>Neutral</fluid-badge>
            <fluid-badge variant="info">Info</fluid-badge>
            <fluid-badge variant="success">Success</fluid-badge>
            <fluid-badge variant="warning">Warning</fluid-badge>
            <fluid-badge variant="danger">Danger</fluid-badge>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Steps</h3>
          <fluid-steps current="1" aria-label="Progress" style="width:100%;">
            <fluid-step description="Your details">Account</fluid-step>
            <fluid-step description="Where to ship">Shipping</fluid-step>
            <fluid-step description="How to pay">Payment</fluid-step>
          </fluid-steps>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Tabs</h3>
          <fluid-tabs value="overview" style="width:100%;">
            <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
            <fluid-tab slot="nav" panel="api">API</fluid-tab>
            <fluid-tab-panel name="overview"
              >Adjust tokens to see styles flow through.</fluid-tab-panel
            >
            <fluid-tab-panel name="api">Live preview of the active brand.</fluid-tab-panel>
          </fluid-tabs>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Accordion</h3>
          <fluid-accordion>
            <fluid-details open>
              <span slot="summary">First</span>
              <p>Open by default.</p>
            </fluid-details>
            <fluid-details>
              <span slot="summary">Second</span>
              <p>Click to expand.</p>
            </fluid-details>
          </fluid-accordion>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Tooltip</h3>
          <div style="padding: var(--fluid-space-4);">
            <fluid-tooltip content="Helpful hint!">
              <fluid-button variant="secondary">Hover me</fluid-button>
            </fluid-tooltip>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Color picker</h3>
          <fluid-color-picker
            value="#3b82f6"
            .palette=${["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4"]}
            aria-label="Color"
          ></fluid-color-picker>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Typeahead</h3>
          <fluid-typeahead
            aria-label="Country"
            placeholder="Search countries…"
            .options=${[
              { value: "nl", label: "Netherlands" },
              { value: "be", label: "Belgium" },
              { value: "de", label: "Germany" },
              { value: "fr", label: "France" },
              { value: "es", label: "Spain" },
              { value: "it", label: "Italy" },
              { value: "uk", label: "United Kingdom" },
              { value: "us", label: "United States" }
            ]}
          ></fluid-typeahead>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Code block</h3>
          <fluid-code-block
            language="css"
            code=":root {
  --fluid-color-brand-500: #3b82f6;
  --fluid-radius-md: 0.5rem;
}"
          ></fluid-code-block>
        </fluid-card>

        <preview-card tag="fluid-avatar" label="Avatar">
          <div style="display:flex; gap: var(--fluid-space-3); align-items: flex-end;">
            <fluid-avatar size="sm" label="Ada Lovelace"></fluid-avatar>
            <fluid-avatar size="md" label="Grace Hopper"></fluid-avatar>
            <fluid-avatar size="lg" label="Donald Knuth"></fluid-avatar>
            <fluid-avatar size="md" image="https://i.pravatar.cc/100" label="Photo"></fluid-avatar>
          </div>
        </preview-card>

        <preview-card tag="fluid-tag" label="Tag">
          <div style="display:flex; gap: var(--fluid-space-2); flex-wrap: wrap;">
            <fluid-tag>Neutral</fluid-tag>
            <fluid-tag variant="info">Info</fluid-tag>
            <fluid-tag variant="success">Success</fluid-tag>
            <fluid-tag removable>Removable</fluid-tag>
          </div>
        </preview-card>

        <preview-card tag="fluid-callout" label="Callout">
          <fluid-callout variant="info">
            <span slot="header">Heads up</span>
            This is an informational callout.
          </fluid-callout>
        </preview-card>

        <preview-card tag="fluid-spinner" label="Spinner">
          <div style="display:flex; gap: var(--fluid-space-3); align-items: center; font-size: 2rem;">
            <fluid-spinner></fluid-spinner>
            <fluid-spinner style="font-size: 1.25rem;"></fluid-spinner>
            <fluid-spinner style="font-size: 3rem;"></fluid-spinner>
          </div>
        </preview-card>

        <preview-card tag="fluid-skeleton" label="Skeleton">
          <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2);">
            <fluid-skeleton style="height: 1rem; width: 70%;"></fluid-skeleton>
            <fluid-skeleton style="height: 0.75rem;"></fluid-skeleton>
            <fluid-skeleton style="height: 0.75rem; width: 85%;"></fluid-skeleton>
          </div>
        </preview-card>

        <preview-card tag="fluid-progress-bar" label="Progress bar">
          <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
            <fluid-progress-bar value="35" show-value aria-label="Demo 35%">Upload</fluid-progress-bar>
            <fluid-progress-bar value="80" show-value aria-label="Demo 80%">Build</fluid-progress-bar>
            <fluid-progress-bar indeterminate aria-label="Working"></fluid-progress-bar>
          </div>
        </preview-card>

        <preview-card tag="fluid-progress-ring" label="Progress ring">
          <div style="display:flex; gap: var(--fluid-space-4); align-items: center;">
            <fluid-progress-ring value="25" show-value aria-label="25%"></fluid-progress-ring>
            <fluid-progress-ring
              value="60"
              show-value
              style="--fluid-progress-ring-size: 4.5rem;"
              aria-label="60%"
            ></fluid-progress-ring>
            <fluid-progress-ring value="92" show-value aria-label="92%"></fluid-progress-ring>
          </div>
        </preview-card>

        <preview-card tag="fluid-copy-button" label="Copy button">
          <div style="display:flex; gap: var(--fluid-space-3); align-items: center;">
            <fluid-copy-button value="Hello, clipboard!">Copy</fluid-copy-button>
            <fluid-copy-button value="Just the icon"></fluid-copy-button>
          </div>
        </preview-card>

        <preview-card tag="fluid-breadcrumb" label="Breadcrumb">
          <fluid-breadcrumb>
            <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
            <fluid-breadcrumb-item href="/components">Components</fluid-breadcrumb-item>
            <fluid-breadcrumb-item>Avatar</fluid-breadcrumb-item>
          </fluid-breadcrumb>
        </preview-card>

        <preview-card tag="fluid-rating" label="Rating">
          <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
            <fluid-rating value="3" aria-label="Demo 3"></fluid-rating>
            <fluid-rating value="3.5" precision="0.5" aria-label="Demo 3.5"></fluid-rating>
            <fluid-rating value="4" readonly aria-label="Read-only 4"></fluid-rating>
          </div>
        </preview-card>

        <preview-card tag="fluid-checkbox" label="Checkbox">
          <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2);">
            <fluid-checkbox>Unchecked</fluid-checkbox>
            <fluid-checkbox checked>Checked</fluid-checkbox>
            <fluid-checkbox indeterminate>Indeterminate</fluid-checkbox>
            <fluid-checkbox disabled checked>Disabled</fluid-checkbox>
          </div>
        </preview-card>

        <preview-card tag="fluid-radio-group" label="Radio group">
          <fluid-radio-group value="md" aria-label="Size">
            <span slot="label">Pick a size</span>
            <fluid-radio value="sm">Small</fluid-radio>
            <fluid-radio value="md">Medium</fluid-radio>
            <fluid-radio value="lg">Large</fluid-radio>
          </fluid-radio-group>
        </preview-card>

        <preview-card tag="fluid-textarea" label="Textarea">
          <fluid-textarea
            aria-label="Comment"
            placeholder="Write something…"
            maxlength="120"
          ></fluid-textarea>
        </preview-card>

        <preview-card tag="fluid-number-input" label="Number input">
          <div style="max-width: 200px;">
            <fluid-number-input
              aria-label="Quantity"
              value="5"
              min="0"
              max="20"
            ></fluid-number-input>
          </div>
        </preview-card>

        <preview-card tag="fluid-file-input" label="File input">
          <fluid-file-input aria-label="Upload files" multiple></fluid-file-input>
        </preview-card>

        <preview-card tag="fluid-button-group" label="Button group">
          <fluid-button-group aria-label="Format">
            <fluid-button variant="secondary">Bold</fluid-button>
            <fluid-button variant="secondary">Italic</fluid-button>
            <fluid-button variant="secondary">Underline</fluid-button>
          </fluid-button-group>
        </preview-card>

        <preview-card tag="fluid-popup" label="Popup">
          <div style="position: relative; min-height: 8rem;">
            <fluid-popup placement="bottom-start" distance="8">
              <fluid-button
                slot="anchor"
                @click=${(e: Event) => {
                  const popup = (e.currentTarget as HTMLElement).closest(
                    "fluid-popup"
                  ) as (HTMLElement & { open: boolean }) | null;
                  if (popup) popup.open = !popup.open;
                }}
              >
                Toggle popup
              </fluid-button>
              <div
                style="
                  padding: var(--fluid-space-3) var(--fluid-space-4);
                  background: var(--fluid-surface-base);
                  color: var(--fluid-text-primary);
                  border: 1px solid var(--fluid-border-default);
                  border-radius: var(--fluid-radius-md);
                  box-shadow: var(--fluid-shadow-md);
                  font-size: var(--fluid-font-size-sm);
                  max-width: 16rem;
                "
              >
                <strong>Themed popup</strong>
                <p style="margin: var(--fluid-space-1) 0 0;">
                  Positioned with floating-ui.
                </p>
              </div>
            </fluid-popup>
          </div>
        </preview-card>

        <preview-card tag="fluid-popover" label="Popover">
          <fluid-popover placement="bottom-start">
            <fluid-button slot="trigger">Open popover</fluid-button>
            <strong>Quick settings</strong>
            <p style="margin: var(--fluid-space-2) 0 0;">
              Click to toggle. Outside-click or Escape closes.
            </p>
          </fluid-popover>
        </preview-card>

        <preview-card tag="fluid-dropdown" label="Dropdown">
          <fluid-dropdown>
            <fluid-button slot="trigger">Actions</fluid-button>
            <fluid-dropdown-item value="edit">Edit</fluid-dropdown-item>
            <fluid-dropdown-item value="duplicate">Duplicate</fluid-dropdown-item>
            <fluid-dropdown-item type="separator"></fluid-dropdown-item>
            <fluid-dropdown-item value="delete">Delete</fluid-dropdown-item>
          </fluid-dropdown>
        </preview-card>

        <preview-card tag="fluid-dialog" label="Dialog">
          <fluid-button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest("preview-card")!
                .querySelector<HTMLElement & { show: () => void }>("fluid-dialog");
              dialog?.show();
            }}
          >
            Open dialog
          </fluid-button>
          <fluid-dialog>
            <span slot="label">Confirm delete</span>
            <p>This will permanently delete the item.</p>
            <div slot="footer">
              <fluid-button variant="ghost">Cancel</fluid-button>
              <fluid-button>Delete</fluid-button>
            </div>
          </fluid-dialog>
        </preview-card>

        <preview-card tag="fluid-drawer" label="Drawer">
          <fluid-button
            @click=${(e: Event) =>
              (e.target as HTMLElement)
                .closest("preview-card")!
                .querySelector<HTMLElement & { show: () => void }>("fluid-drawer")
                ?.show()}
          >
            Open drawer
          </fluid-button>
          <fluid-drawer placement="end">
            <span slot="label">Filters</span>
            <p>Filter controls would go here.</p>
          </fluid-drawer>
        </preview-card>

        <preview-card tag="fluid-toast" label="Toast">
          <fluid-button
            @click=${(e: Event) => {
              const stack = (e.target as HTMLElement)
                .closest("preview-card")!
                .querySelector<HTMLElement & { toast: (o: { message: string; variant: string }) => void }>("fluid-toast");
              stack?.toast({ message: "Saved!", variant: "success" });
            }}
          >
            Show toast
          </fluid-button>
          <fluid-toast placement="top-end"></fluid-toast>
        </preview-card>

        <!--
          Layout primitives (page / split-panel / scroller) and the format /
          observer / include helpers are intentionally omitted from the theme
          builder. They have no meaningful visual tokens to customize:
          their docs live in the docs site instead. The coverage check
          exempts these tags via PREVIEW_EXEMPT in
          scripts/check-component-coverage.mjs.
        -->

        <preview-card tag="fluid-carousel" label="Carousel">
          <fluid-carousel
            style="max-width: 18rem; --fluid-carousel-aspect-ratio: 4 / 3;"
          >
            <fluid-carousel-item>
              <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white;">One</div>
            </fluid-carousel-item>
            <fluid-carousel-item>
              <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#0891b2; color:white;">Two</div>
            </fluid-carousel-item>
            <fluid-carousel-item>
              <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#db2777; color:white;">Three</div>
            </fluid-carousel-item>
          </fluid-carousel>
        </preview-card>

        <preview-card tag="fluid-tree" label="Tree">
          <fluid-tree style="max-width: 14rem;">
            <fluid-tree-item expanded>
              Folder
              <fluid-tree-item>File 1</fluid-tree-item>
              <fluid-tree-item>File 2</fluid-tree-item>
            </fluid-tree-item>
            <fluid-tree-item>Other</fluid-tree-item>
          </fluid-tree>
        </preview-card>

        <preview-card tag="fluid-comparison" label="Comparison">
          <fluid-comparison style="max-width: 18rem; border-radius: var(--fluid-radius-md);">
            <div slot="before" style="aspect-ratio:16/9; background:#475569; color:white; display:flex; align-items:center; justify-content:center;">Before</div>
            <div slot="after" style="aspect-ratio:16/9; background:#0ea5e9; color:white; display:flex; align-items:center; justify-content:center;">After</div>
          </fluid-comparison>
        </preview-card>

        <preview-card tag="fluid-markdown" label="Markdown">
          <fluid-markdown
            value="### Hello

This is **markdown** with [links](https://example.com), \`inline code\`, and lists:

- one
- two
- three"
          ></fluid-markdown>
        </preview-card>

        <preview-card tag="fluid-qr-code" label="QR code">
          <fluid-qr-code value="https://fluid-ds.example.com" size="120"></fluid-qr-code>
        </preview-card>

        <preview-card tag="fluid-animated-image" label="Animated image">
          <fluid-animated-image
            src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif"
            alt="Rotating Earth"
            style="max-width: 12rem;"
          ></fluid-animated-image>
        </preview-card>

        <preview-card tag="fluid-video" label="Video">
          <fluid-video
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
            muted
            plays-inline
            style="max-width: 22rem;"
          ></fluid-video>
        </preview-card>

        <preview-card tag="fluid-video-playlist" label="Video playlist">
          <fluid-video-playlist
            .entries=${[
              {
                title: "Big Buck Bunny",
                src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              },
              {
                title: "Elephants Dream",
                src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              }
            ]}
          ></fluid-video-playlist>
        </preview-card>

        <preview-card tag="fluid-zoomable-frame" label="Zoomable frame">
          <fluid-zoomable-frame style="height: 14rem;">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"
              alt="Mountain lake"
              style="max-width: 100%; display: block;"
            />
          </fluid-zoomable-frame>
        </preview-card>

        <preview-card tag="fluid-bar-chart" label="Bar chart">
          <fluid-bar-chart
            style="height: 14rem;"
            .data=${{
              labels: ["Jan", "Feb", "Mar", "Apr", "May"],
              datasets: [
                { label: "Revenue", data: [12, 19, 15, 22, 28], backgroundColor: "#4f46e5" }
              ]
            }}
          ></fluid-bar-chart>
        </preview-card>

        <preview-card tag="fluid-line-chart" label="Line chart">
          <fluid-line-chart
            style="height: 14rem;"
            .data=${{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [
                {
                  label: "Visitors",
                  data: [120, 142, 175, 168, 198, 220, 215],
                  borderColor: "#0891b2",
                  backgroundColor: "rgba(8, 145, 178, 0.15)",
                  fill: true,
                  tension: 0.3
                }
              ]
            }}
          ></fluid-line-chart>
        </preview-card>

        <preview-card tag="fluid-pie-chart" label="Pie chart">
          <fluid-pie-chart
            style="height: 14rem;"
            .data=${{
              labels: ["A", "B", "C", "D"],
              datasets: [
                {
                  data: [30, 25, 20, 25],
                  backgroundColor: ["#4f46e5", "#0891b2", "#db2777", "#16a34a"]
                }
              ]
            }}
          ></fluid-pie-chart>
        </preview-card>

        <preview-card tag="fluid-doughnut-chart" label="Doughnut chart">
          <fluid-doughnut-chart
            style="height: 14rem;"
            .data=${{
              labels: ["Cash", "Stocks", "Crypto"],
              datasets: [
                {
                  data: [55, 30, 15],
                  backgroundColor: ["#16a34a", "#4f46e5", "#f59e0b"]
                }
              ]
            }}
          ></fluid-doughnut-chart>
        </preview-card>

        <preview-card tag="fluid-scatter-chart" label="Scatter chart">
          <fluid-scatter-chart
            style="height: 14rem;"
            .data=${{
              datasets: [
                {
                  label: "Sample",
                  data: Array.from({ length: 25 }, () => ({
                    x: Math.random() * 10,
                    y: Math.random() * 10
                  })),
                  backgroundColor: "#4f46e5"
                }
              ]
            }}
          ></fluid-scatter-chart>
        </preview-card>

        <preview-card tag="fluid-bubble-chart" label="Bubble chart">
          <fluid-bubble-chart
            style="height: 14rem;"
            .data=${{
              datasets: [
                {
                  label: "Bubbles",
                  data: Array.from({ length: 8 }, () => ({
                    x: Math.random() * 10,
                    y: Math.random() * 10,
                    r: 6 + Math.random() * 14
                  })),
                  backgroundColor: "rgba(219, 39, 119, 0.5)"
                }
              ]
            }}
          ></fluid-bubble-chart>
        </preview-card>

        <preview-card tag="fluid-radar-chart" label="Radar chart">
          <fluid-radar-chart
            style="height: 14rem;"
            .data=${{
              labels: ["Speed", "Power", "Range", "Comfort", "Style"],
              datasets: [
                {
                  label: "Model X",
                  data: [85, 90, 70, 80, 75],
                  borderColor: "#4f46e5",
                  backgroundColor: "rgba(79, 70, 229, 0.2)"
                }
              ]
            }}
          ></fluid-radar-chart>
        </preview-card>

        <preview-card tag="fluid-polar-area-chart" label="Polar area chart">
          <fluid-polar-area-chart
            style="height: 14rem;"
            .data=${{
              labels: ["Red", "Green", "Blue", "Yellow"],
              datasets: [
                {
                  data: [11, 16, 7, 14],
                  backgroundColor: [
                    "rgba(239, 68, 68, 0.6)",
                    "rgba(22, 163, 74, 0.6)",
                    "rgba(59, 130, 246, 0.6)",
                    "rgba(234, 179, 8, 0.6)"
                  ]
                }
              ]
            }}
          ></fluid-polar-area-chart>
        </preview-card>

        <preview-card tag="fluid-sparkline" label="Sparkline">
          <div style="display: flex; align-items: center; gap: var(--fluid-space-3);">
            <strong style="font-size: var(--fluid-font-size-xl);">$48.2k</strong>
            <fluid-sparkline
              .values=${[12, 15, 10, 18, 22, 19, 25, 28, 26, 32, 30, 35]}
            ></fluid-sparkline>
            <fluid-tag variant="success">+18%</fluid-tag>
          </div>
        </preview-card>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "component-preview": ComponentPreview;
  }
}
