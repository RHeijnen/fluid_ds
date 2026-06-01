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
          <h3 slot="header">Kbd</h3>
          <span style="display:inline-flex;align-items:center;gap:0.3rem;">
            <fluid-kbd>Ctrl</fluid-kbd> + <fluid-kbd>K</fluid-kbd>
          </span>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Stat</h3>
          <fluid-stat label="Revenue" value="$48.2k" change="+12%" trend="up"></fluid-stat>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Empty state</h3>
          <fluid-empty-state heading="No projects yet">
            Create your first project to get started.
          </fluid-empty-state>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Avatar group</h3>
          <fluid-avatar-group max="3">
            <fluid-avatar label="Ada Lovelace"></fluid-avatar>
            <fluid-avatar label="Grace Hopper"></fluid-avatar>
            <fluid-avatar label="Alan Turing"></fluid-avatar>
            <fluid-avatar label="Katherine Johnson"></fluid-avatar>
            <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
          </fluid-avatar-group>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Banner</h3>
          <fluid-banner variant="info" dismissible>
            We are performing scheduled maintenance this weekend.
            <fluid-button slot="actions" variant="primary" size="sm">Accept</fluid-button>
          </fluid-banner>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Timeline</h3>
          <fluid-timeline aria-label="Order history">
            <fluid-timeline-item><span slot="time">09:24</span><strong>Order placed</strong></fluid-timeline-item>
            <fluid-timeline-item tone="info"><span slot="time">10:02</span><strong>Payment confirmed</strong></fluid-timeline-item>
            <fluid-timeline-item tone="success"><span slot="time">14:51</span><strong>Shipped</strong></fluid-timeline-item>
          </fluid-timeline>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Pagination</h3>
          <fluid-pagination total-pages="20" page="4"></fluid-pagination>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Menu</h3>
          <fluid-menu aria-label="Account menu">
            <fluid-menu-label>Account</fluid-menu-label>
            <fluid-menu-item value="profile">Profile</fluid-menu-item>
            <fluid-menu-item value="billing">Billing</fluid-menu-item>
            <fluid-menu-item value="delete" disabled>Delete account</fluid-menu-item>
            <fluid-menu-item value="logout">Sign out</fluid-menu-item>
          </fluid-menu>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Toolbar</h3>
          <fluid-toolbar aria-label="Text formatting">
            <fluid-button variant="ghost">Bold</fluid-button>
            <fluid-button variant="ghost">Italic</fluid-button>
            <fluid-button variant="ghost">Underline</fluid-button>
          </fluid-toolbar>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Command palette</h3>
          <fluid-button
            @click=${(e: Event) => {
              const cp = (e.currentTarget as HTMLElement).nextElementSibling as
                | (HTMLElement & { show?: () => void })
                | null;
              cp?.show?.();
            }}
            >Open palette</fluid-button
          >
          <fluid-command-palette
            .items=${[
              { id: "new", label: "New File", hint: "⌘N", group: "File" },
              { id: "open", label: "Open File…", hint: "⌘O", group: "File" },
              { id: "copy", label: "Copy", hint: "⌘C", group: "Edit" }
            ]}
          ></fluid-command-palette>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">OTP input</h3>
          <fluid-otp length="6" value="123" aria-label="One-time code"></fluid-otp>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Tag input</h3>
          <fluid-tag-input aria-label="Tags" value="react,typescript,lit" placeholder="Add a tag…"></fluid-tag-input>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Field</h3>
          <fluid-field label="Email" description="We'll never share it." for="pg-field-email">
            <fluid-input id="pg-field-email" type="email" placeholder="you@example.com"></fluid-input>
          </fluid-field>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Speed dial</h3>
          <div style="display:flex; justify-content:center; padding:4rem 1rem;">
            <fluid-speed-dial label="Quick actions" placement="up" open>
              <fluid-button variant="ghost" aria-label="Share">Share</fluid-button>
              <fluid-button variant="ghost" aria-label="Edit">Edit</fluid-button>
              <fluid-button variant="ghost" aria-label="Delete">Delete</fluid-button>
            </fluid-speed-dial>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Pricing table</h3>
          <fluid-pricing-table>
            <fluid-pricing-tier name="Starter" price="$0" period="/mo">
              <li>1 project</li>
              <li>Community support</li>
              <fluid-button slot="action" variant="secondary">Choose Starter</fluid-button>
            </fluid-pricing-tier>
            <fluid-pricing-tier name="Pro" price="$29" period="/mo" featured>
              <li>Unlimited projects</li>
              <li>Priority support</li>
              <fluid-button slot="action" variant="primary">Choose Pro</fluid-button>
            </fluid-pricing-tier>
          </fluid-pricing-table>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Table</h3>
          <fluid-table
            caption="Contributors"
            .columns=${[
              { key: "name", label: "Name", sortable: true },
              { key: "role", label: "Role", sortable: true },
              { key: "commits", label: "Commits", sortable: true, align: "end" }
            ]}
            .rows=${[
              { id: 1, name: "Ada Lovelace", role: "Engineer", commits: 312 },
              { id: 2, name: "Grace Hopper", role: "Architect", commits: 1290 },
              { id: 3, name: "Alan Turing", role: "Researcher", commits: 87 }
            ]}
            .sort=${{ key: "commits", dir: "desc" }}
            selectable
          ></fluid-table>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Event calendar</h3>
          <fluid-event-calendar
            .month=${"2026-06"}
            .events=${[
              { id: "1", date: "2026-06-03", title: "Standup", tone: "accent" },
              { id: "2", date: "2026-06-10", title: "Release cut", tone: "warning" },
              { id: "3", date: "2026-06-25", title: "Demo day", tone: "success" }
            ]}
            week-start="1"
          ></fluid-event-calendar>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Rich text editor</h3>
          <fluid-rich-text-editor
            label="Compose a note"
            placeholder="Start typing..."
            .value=${"<p>Fluid ships an <strong>accessible</strong> editor.</p>"}
          ></fluid-rich-text-editor>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Kanban</h3>
          <fluid-kanban
            .columns=${[
              { id: "todo", title: "To do", cards: [{ id: "c1", title: "Draft the spec" }, { id: "c2", title: "Set up CI" }] },
              { id: "doing", title: "In progress", cards: [{ id: "c3", title: "Build the board" }] },
              { id: "done", title: "Done", cards: [{ id: "c4", title: "Kickoff" }] }
            ]}
          ></fluid-kanban>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Map</h3>
          <fluid-map
            label="Map of central London"
            style="--fluid-map-height: 16rem;"
            .center=${[51.505, -0.09]}
            .zoom=${13}
            .markers=${[{ lat: 51.505, lng: -0.09, label: "Centre" }, { lat: 51.51, lng: -0.1, label: "North west" }]}
          ></fluid-map>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Audio</h3>
          <fluid-audio label="Sample track"></fluid-audio>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Lightbox</h3>
          <fluid-lightbox loop>
            <img src="https://picsum.photos/seed/fluid1/160/160" alt="Sample 1" />
            <img src="https://picsum.photos/seed/fluid2/160/160" alt="Sample 2" />
            <img src="https://picsum.photos/seed/fluid3/160/160" alt="Sample 3" />
          </fluid-lightbox>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Calendar</h3>
          <fluid-calendar value="2026-06-15" aria-label="Demo calendar"></fluid-calendar>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Date picker</h3>
          <fluid-date-picker value="2026-06-15"></fluid-date-picker>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Date range picker</h3>
          <fluid-date-range-picker start="2026-06-08" end="2026-06-19"></fluid-date-range-picker>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Time slots</h3>
          <fluid-time-slots
            date="2026-06-15"
            .slots=${[
              { start: "2026-06-15T09:00", end: "2026-06-15T09:30", remaining: 1, state: "available" },
              { start: "2026-06-15T09:30", end: "2026-06-15T10:00", remaining: 1, state: "available" },
              { start: "2026-06-15T10:00", end: "2026-06-15T10:30", remaining: 0, state: "full" },
              { start: "2026-06-15T10:30", end: "2026-06-15T11:00", remaining: 1, state: "available" }
            ]}
            value="2026-06-15T09:30"
            no-heading
          ></fluid-time-slots>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Scheduler</h3>
          <fluid-scheduler
            .availability=${{
              weekly: {
                1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
                2: [{ start: "09:00", end: "17:00" }],
                3: [{ start: "09:00", end: "17:00" }],
                4: [{ start: "09:00", end: "17:00" }],
                5: [{ start: "09:00", end: "16:00" }],
                6: [{ start: "09:00", end: "12:00" }]
              },
              slotMinutes: 30,
              maxAdvanceDays: 30
            }}
          ></fluid-scheduler>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Availability editor</h3>
          <fluid-availability-editor
            .availability=${{
              weekly: { 1: [{ start: "09:00", end: "17:00" }], 2: [{ start: "09:00", end: "17:00" }] },
              slotMinutes: 30
            }}
          ></fluid-availability-editor>
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

        <preview-card tag="fluid-hero" label="Hero">
          <fluid-hero style="width: 100%;">
            <span slot="eyebrow">New in 0.1</span>
            <h1 style="font-size: 1.75rem;">Build interfaces that flow</h1>
            <p slot="description">Accessible web components for any framework.</p>
            <div slot="actions">
              <fluid-button variant="primary">Get started</fluid-button>
              <fluid-button variant="ghost">GitHub</fluid-button>
            </div>
          </fluid-hero>
        </preview-card>

        <preview-card tag="fluid-form" label="Form">
          <fluid-form style="max-width: 18rem;">
          <label>Name <input name="name" required placeholder="Ada Lovelace" /></label>
          <label>Email <input name="email" type="email" required placeholder="ada@example.com" /></label>
          <button slot="actions" type="submit">Submit</button>
          <button slot="actions" type="reset">Reset</button>
          </fluid-form>
        </preview-card>

        <preview-card tag="fluid-fieldset" label="Fieldset">
          <div class="demo">
          <fluid-fieldset legend="Contact details" description="We will only use this to reach you." style="max-width: 22rem;">
          <label style="display:flex; flex-direction:column; gap:0.25rem;">
          <span>Email</span>
          <input type="email" name="email" />
          </label>
          <label style="display:flex; flex-direction:column; gap:0.25rem;">
          <span>Phone</span>
          <input type="tel" name="phone" />
          </label>
          </fluid-fieldset>
          <fluid-fieldset legend="Disabled group" disabled style="max-width: 22rem;">
          <label style="display:flex; flex-direction:column; gap:0.25rem;">
          <span>Locked</span>
          <input type="text" name="locked" />
          </label>
          </fluid-fieldset>
          </div>
        </preview-card>

        <preview-card tag="fluid-range-slider" label="Range slider">
          <div style="max-width: 360px;">
          <fluid-range-slider value-min="25" value-max="75"></fluid-range-slider>
          </div>
        </preview-card>

        <preview-card tag="fluid-time-picker" label="Time picker">
          <fluid-time-picker value="09:30"></fluid-time-picker>
        </preview-card>

        <preview-card tag="fluid-masked-input" label="Masked input">
          <div class="demo">
          <fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>
          <fluid-masked-input mask="##/##/####" value="12/25/2030" aria-label="Date"></fluid-masked-input>
          <fluid-masked-input mask="(###) ###-####" disabled value="(555) 123-4567" aria-label="Disabled"></fluid-masked-input>
          </div>
        </preview-card>

        <preview-card tag="fluid-transfer" label="Transfer">
          <fluid-transfer
          source-label="Available"
          target-label="Selected"
          .items=${[
          { id: "react", label: "React" },
          { id: "vue", label: "Vue" },
          { id: "angular", label: "Angular" },
          { id: "svelte", label: "Svelte" }
          ]}
          .value=${["vue"]}
          ></fluid-transfer>
        </preview-card>

        <preview-card tag="fluid-dropzone" label="Dropzone">
          <div style="width: 100%;">
          <fluid-dropzone multiple accept="image/*" label="Drag files here or click to browse"></fluid-dropzone>
          </div>
        </preview-card>

        <preview-card tag="fluid-app-bar" label="App bar">
          <fluid-app-bar elevated menu-button>
          <strong slot="start">Acme</strong>
          <a href="#" style="color: inherit;">Dashboard</a>
          <a href="#" style="color: inherit;">Projects</a>
          <span slot="end">Sign in</span>
          </fluid-app-bar>
        </preview-card>

        <preview-card tag="fluid-sidebar" label="Sidebar">
          <div style="block-size: 220px; display:flex; border:1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md); overflow:hidden;">
          <fluid-sidebar aria-label="Primary navigation" collapsible>
          <strong slot="header">Fluid</strong>
          <nav aria-label="Primary" style="display:flex; flex-direction:column; gap: var(--fluid-space-1);">
          <a href="#" aria-current="page" style="display:block; padding: var(--fluid-space-2) var(--fluid-space-3); border-radius: var(--fluid-radius-sm); color: inherit; text-decoration:none;">Dashboard</a>
          <a href="#" style="display:block; padding: var(--fluid-space-2) var(--fluid-space-3); border-radius: var(--fluid-radius-sm); color: inherit; text-decoration:none;">Projects</a>
          <a href="#" style="display:block; padding: var(--fluid-space-2) var(--fluid-space-3); border-radius: var(--fluid-radius-sm); color: inherit; text-decoration:none;">Settings</a>
          </nav>
          <small slot="footer">v1.0.0</small>
          </fluid-sidebar>
          <div style="flex:1; padding: var(--fluid-space-4);">Page content</div>
          </div>
        </preview-card>

        <preview-card tag="fluid-nav-list" label="Nav list">
          <div style="max-width: 16rem;">
          <fluid-nav-list label="Main">
          <fluid-nav-item href="#dashboard" current>Dashboard</fluid-nav-item>
          <fluid-nav-item href="#projects">Projects</fluid-nav-item>
          <fluid-nav-item href="#team">Team</fluid-nav-item>
          <fluid-nav-item href="#settings">Settings</fluid-nav-item>
          </fluid-nav-list>
          </div>
        </preview-card>

        <preview-card tag="fluid-anchor-nav" label="Anchor nav">
          <fluid-anchor-nav
          .items=${[
          { id: "demo-intro", label: "Introduction", level: 2 },
          { id: "demo-install", label: "Installation", level: 2 },
          { id: "demo-config", label: "Configuration", level: 3 },
          { id: "demo-usage", label: "Usage", level: 2 }
          ]}
          ></fluid-anchor-nav>
        </preview-card>

        <preview-card tag="fluid-context-menu" label="Context menu">
          <fluid-context-menu
          aria-label="Item actions"
          .items=${[
          { label: "Cut", value: "cut" },
          { label: "Copy", value: "copy" },
          { label: "Paste", value: "paste", disabled: true },
          { label: "", value: "", divider: true },
          { label: "Delete", value: "delete" }
          ]}
          >
          <div
          slot="trigger"
          tabindex="0"
          style="display:grid;place-items:center;width:100%;height:6rem;border:1px dashed var(--fluid-border-default);border-radius:var(--fluid-radius-md);color:var(--fluid-text-secondary);cursor:context-menu;user-select:none;"
          >
          Right-click here (or Shift+F10)
          </div>
          </fluid-context-menu>
        </preview-card>

        <preview-card tag="fluid-meter" label="Meter">
          <div style="max-width: 320px;">
          <fluid-meter value="72" low="33" high="66" optimum="80" show-value label="Disk usage">Disk usage</fluid-meter>
          </div>
        </preview-card>

        <preview-card tag="fluid-popconfirm" label="Popconfirm">
          <fluid-popconfirm message="Delete this item? This cannot be undone." confirm-text="Delete" tone="danger">
          <fluid-button slot="trigger" variant="secondary" tone="danger">Delete</fluid-button>
          </fluid-popconfirm>
        </preview-card>

        <preview-card tag="fluid-result" label="Result">
          <fluid-result status="success" title="Payment successful" subtitle="Your order is confirmed. A receipt has been emailed to you.">
          <fluid-button slot="actions" variant="primary">View order</fluid-button>
          <fluid-button slot="actions" variant="secondary">Back home</fluid-button>
          </fluid-result>
        </preview-card>

        <preview-card tag="fluid-tour" label="Tour">
          <div id="pg-tour-anchor" style="display:flex; gap:0.75rem; align-items:center;">
          <button id="pg-tour-search" style="padding:0.5rem 0.75rem;">Search</button>
          <button id="pg-tour-new" style="padding:0.5rem 0.75rem;">New</button>
          <button id="pg-tour-start" style="padding:0.5rem 0.75rem;">Start tour</button>
          </div>
          <fluid-tour id="pg-tour" .steps=${[
          { target: "#pg-tour-search", title: "Search everything", body: "Jump to anything from here.", placement: "bottom-start" },
          { target: "#pg-tour-new", title: "Create in one click", body: "Start a new project.", placement: "bottom" }
          ]} @click=${(e: Event) => {
          if ((e.target as HTMLElement).id === "pg-tour-start") (document.getElementById("pg-tour") as HTMLElement & { show(): void }).show();
          }}></fluid-tour>
        </preview-card>

        <preview-card tag="fluid-loading-overlay" label="Loading overlay">
          <fluid-loading-overlay active label="Loading account…">
          <div style="width: 280px; padding: var(--fluid-space-5); border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-md); background: var(--fluid-surface-base); color: var(--fluid-text-primary);">
          <h3 style="margin: 0 0 var(--fluid-space-2);">Account summary</h3>
          <p style="margin: 0; color: var(--fluid-text-secondary);">Balance and recent activity load here.</p>
          </div>
          </fluid-loading-overlay>
        </preview-card>

        <preview-card tag="fluid-image" label="Image">
          <fluid-image
          src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=640&q=80"
          alt="A scenic mountain landscape at dusk"
          width="280"
          aspect-ratio="16/9"
          placeholder="#e4e4e7"
          ></fluid-image>
        </preview-card>

        <preview-card tag="fluid-description-list" label="Description list">
          <fluid-description-list columns="2" divider aria-label="Account details" style="max-width: 40rem;">
          <fluid-description-item>
          <span slot="term">Name</span>
          Ada Lovelace
          </fluid-description-item>
          <fluid-description-item>
          <span slot="term">Email</span>
          ada@example.com
          </fluid-description-item>
          <fluid-description-item>
          <span slot="term">Role</span>
          Administrator
          </fluid-description-item>
          <fluid-description-item>
          <span slot="term">Member since</span>
          March 2021
          </fluid-description-item>
          </fluid-description-list>
        </preview-card>

        <preview-card tag="fluid-list" label="List">
          <fluid-list label="Team members" bordered divided style="max-width: 22rem;">
          <fluid-list-item>
          <span slot="leading">👤</span>
          Ada Lovelace
          <span slot="description">Owner</span>
          <span slot="trailing">Admin</span>
          </fluid-list-item>
          <fluid-list-item interactive>
          <span slot="leading">🚀</span>
          Side Project
          <span slot="description">3 projects</span>
          </fluid-list-item>
          <fluid-list-item href="#docs">
          Documentation
          <span slot="trailing">→</span>
          </fluid-list-item>
          </fluid-list>
        </preview-card>

        <preview-card tag="fluid-truncate" label="Truncate">
          <div style="max-width: 24rem;">
          <fluid-truncate lines="3">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </fluid-truncate>
          </div>
        </preview-card>

        <preview-card tag="fluid-countdown" label="Countdown">
          <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4);">
          <fluid-countdown seconds="90061" format="segments"></fluid-countdown>
          <fluid-countdown seconds="3661" format="clock"></fluid-countdown>
          </div>
        </preview-card>

        <preview-card tag="fluid-theme-toggle" label="Theme toggle">
          <fluid-theme-toggle .brands=${["", "midnight", "corporate"]}></fluid-theme-toggle>
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
