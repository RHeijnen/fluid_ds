import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { themeStore } from "./store.js";
import { componentOverridesStore } from "./component-overrides-store.js";
import type { FluidInfiniteTableCellContext } from "@fluid-ds/table";
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

    /* One shared canvas instead of the per-card white sheets: the theme
       store re-declares light-scheme semantics on this element, so it must
       provide the light background those text colors assume, whatever
       scheme the surrounding shell is in. */
    .surface {
      display: block;
      background: var(--fluid-surface-base);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      padding: var(--fluid-space-5);
    }
    .section-tabs {
      display: block;
    }
    /* Panels hold the sections; give the strip some air above the grid. */
    fluid-tab-panel .grid {
      padding-block-start: var(--fluid-space-5);
    }

    /* Composed scenes: a section rendered as the real thing (the Forms tab
       is one actual form) instead of a specimen grid. */
    .scene {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-6);
      padding-block-start: var(--fluid-space-5);
      max-width: 70rem;
    }
    .scene-head h3 {
      margin: 0;
      font-size: var(--fluid-font-size-xl);
      font-weight: var(--fluid-font-weight-semibold);
      /* Inherited color would be the shell's (dark-chrome) text; the scene
         sits on the light surface, so read the surface-scoped token. */
      color: var(--fluid-text-primary);
    }
    .scene-head p {
      margin: var(--fluid-space-1) 0 0;
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
    .scene-cols {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
      gap: var(--fluid-space-6);
      align-items: start;
    }
    .scene-col {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-5);
      min-width: 0;
    }
    .scene-fields {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-4);
    }
    .scene-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--fluid-space-4);
    }
    .scene-checks {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }
    .scene-foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-4);
      border-block-start: 1px solid var(--fluid-border-default);
      padding-block-start: var(--fluid-space-4);
    }
    .scene-foot-note {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
    .scene-foot-actions {
      display: flex;
      gap: var(--fluid-space-3);
    }

    /* Actions scene: the document editor chrome. */
    .editor {
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      overflow: hidden;
      background: var(--fluid-surface-base);
    }
    .editor-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-3) var(--fluid-space-4);
      border-block-end: 1px solid var(--fluid-border-default);
    }
    .editor-bar-spacer {
      flex: 1 1 auto;
    }
    .editor-hint {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-1);
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
    .editor-doc {
      position: relative;
      padding: var(--fluid-space-6);
      min-height: 16rem;
    }
    .editor-doc h4 {
      margin: 0 0 var(--fluid-space-3);
      font-size: var(--fluid-font-size-lg);
      color: var(--fluid-text-primary);
    }
    .editor-doc p {
      margin: 0 0 var(--fluid-space-3);
      max-width: 46rem;
      color: var(--fluid-text-secondary);
      line-height: 1.6;
    }
    .editor-dial {
      position: absolute;
      inset-block-end: var(--fluid-space-4);
      inset-inline-end: var(--fluid-space-4);
    }
    .editor-foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-3) var(--fluid-space-4);
      border-block-start: 1px solid var(--fluid-border-default);
    }
    .share-row {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
    }
    /* Feedback scene: the release status page. */
    .status-panel {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-4);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      padding: var(--fluid-space-5);
      background: var(--fluid-surface-base);
    }
    .status-panel h4 {
      margin: 0;
      font-size: var(--fluid-font-size-md);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
    }
    .status-stack {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-3);
    }
    .status-rings {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-5);
    }
    .ring-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--fluid-space-1);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }
    .status-badges {
      display: flex;
      flex-wrap: wrap;
      gap: var(--fluid-space-2);
    }
    .status-count {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }
    .status-inner-card {
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      padding: var(--fluid-space-4);
      background: var(--fluid-surface-base);
    }
    .status-inner-card h5 {
      margin: 0 0 var(--fluid-space-2);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
    }
    .status-inner-card p {
      margin: 0;
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }
    .status-live {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
    /* Charts scene: the analytics board. */
    .chart-board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
      gap: var(--fluid-space-5);
      align-items: start;
    }
    .chart-wide {
      grid-column: 1 / -1;
    }
    .chart-headline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--fluid-space-4);
    }
    .chart-headline-label {
      display: block;
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }
    .chart-headline-value {
      font-size: var(--fluid-font-size-xl);
      color: var(--fluid-text-primary);
    }

    /* Media scene: the press kit. */
    .media-hero {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }
    .media-hero figcaption {
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }

    /* Overlays scene: the workspace settings page. */
    .settings-actions {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
    }
    .settings-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--fluid-space-3);
    }
    .settings-bar fluid-input {
      flex: 1 1 16rem;
      min-inline-size: 0;
    }
    .settings-rows {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-4);
    }
    .settings-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
    }
    .settings-label {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-1);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-text-primary);
    }
    .settings-note {
      margin: 0 0 var(--fluid-space-4);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }

    /* Navigation scene: the docs app frame. */
    .appframe {
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      overflow: hidden;
      background: var(--fluid-surface-base);
    }
    .appframe-body {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) 15rem;
      align-items: start;
    }
    .appframe-main {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-5);
      padding: var(--fluid-space-5);
      min-inline-size: 0;
      border-inline: 1px solid var(--fluid-border-default);
    }
    .appframe-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
    }
    .appframe-title h4 {
      margin: 0;
      font-size: var(--fluid-font-size-xl);
      color: var(--fluid-text-primary);
    }
    .appframe-section {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-3);
    }
    .appframe-section h5 {
      margin: 0;
      font-size: var(--fluid-font-size-md);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
    }
    .appframe-related {
      display: grid;
      place-items: center;
      inline-size: 100%;
      block-size: 5rem;
      border: 1px dashed var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      color: var(--fluid-text-secondary);
      cursor: context-menu;
      user-select: none;
    }
    .appframe-aside {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-3);
      padding: var(--fluid-space-5) var(--fluid-space-4);
    }
    .appframe-aside-label {
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--fluid-text-secondary);
    }
    @media (max-width: 68rem) {
      .appframe-body {
        grid-template-columns: minmax(0, 1fr);
      }
      .appframe-main {
        border-inline: 0;
      }
    }

    /* Scheduling scene: the booking console. */
    .booking {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
      gap: var(--fluid-space-5);
      align-items: start;
    }
    /* The day picker is a fixed-width calendar; letting its card take an equal
       share stranded ~460px of dead space beside it. */
    .booking-flow {
      grid-template-columns: auto minmax(18rem, 1fr);
    }
    @media (max-width: 60rem) {
      .booking-flow {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    /* Data scene: the project workspace. */
    .scene-wide {
      max-width: none;
    }
    .scene-head-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--fluid-space-4);
    }
    .scene-head-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--fluid-space-3);
    }
    .scene-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--fluid-space-2);
    }
    .data-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--fluid-space-4);
    }
    .about-owner {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-3);
      margin-block-end: var(--fluid-space-4);
    }
    .about-owner div {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .about-owner small {
      color: var(--fluid-text-secondary);
    }
    .qr-row {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-4);
    }
    .qr-row p {
      margin: 0;
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
    }

    .status-rate {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-3);
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }

    .share-row code {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-text-secondary);
      background: var(--fluid-surface-subtle);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-sm);
      padding: 0.15rem 0.5rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--fluid-space-4);
      /* Each card takes its own natural height; without this, every card in a
         row stretches to the tallest one (so a big component bloated its
         neighbours). */
      align-items: start;
    }

    /* fluid-map renders in LIGHT DOM and normally gets its display:block + height
       from a stylesheet injected into document.head. Here the map lives inside
       this preview's shadow root, where that global style cannot reach it, so it
       falls back to display:inline and Leaflet balloons the tile container to
       ~1600px. These shadow-scoped rules constrain it to a sensible preview size
       (the map's light DOM is this shadow tree, so the descendant selector works). */
    fluid-map {
      display: block;
    }
    fluid-map .viewport {
      height: var(--fluid-map-height, 14rem) !important;
    }

    /* Cap any genuinely large component (scheduler, calendar, kanban) so a single
       card never dominates the gallery; the few that exceed this scroll. */
    .grid > * {
      max-height: 30rem;
      overflow: auto;
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

  /* Token overrides land on this wrapper (not the per-section grids) so the
     inline CSS variables cascade into every tab panel at once. */
  @query(".surface") private grid!: HTMLElement;

  /**
   * Booking-scene selection. fluid-calendar and fluid-time-slots are
   * CONTROLLED components: they announce an activation and expect the host to
   * feed the value back. Holding it in state here is what makes the demo
   * actually book something instead of looking inert.
   */
  @state() private bookingDay = "2026-06-15";
  @state() private bookingTime = "2026-06-15T09:30";

  private unsubscribe?: () => void;
  private unsubscribeComponents?: () => void;
  private refreshTimer?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeComponents = componentOverridesStore.subscribe(() => {
      this.applyComponentOverrides();
    });
    this.unsubscribe = themeStore.subscribe(() => {
      if (!this.grid) return;
      themeStore.applyTo(this.grid);
      /*
       * Canvas components paint their colours once and cannot observe an
       * inherited custom-property change, so an override that lands on the
       * surface leaves them stale. Ask them to re-read the tokens.
       */
      this.refreshCanvasComponents();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.refreshTimer !== undefined) window.clearTimeout(this.refreshTimer);
    this.unsubscribe?.();
    this.unsubscribeComponents?.();
  }

  override firstUpdated(): void {
    themeStore.applyTo(this.grid);
    /*
     * Paint per-element overrides restored from the URL. They are written as
     * inline custom properties on the elements themselves, and the only code
     * that writes them is the control the user is dragging, so a shared link
     * would otherwise load the right data and render none of it. This runs
     * here because the restore happens at bootstrap, before the preview these
     * overrides target has rendered.
     */
    this.applyComponentOverrides();
  }

  /**
   * Mirror the component-scoped overrides into the preview as a real
   * stylesheet, the same text the export panel hands the user.
   *
   * A stylesheet rather than inline styles on each instance: the override is
   * per component, so `fluid-radio { ... }` reaches every radio, including any
   * rendered after this runs, and previewing the exported CSS verbatim means
   * the preview cannot drift from what is exported.
   */
  private applyComponentOverrides(): void {
    const root = this.renderRoot as ShadowRoot;
    let sheet = root.querySelector<HTMLStyleElement>("style[data-component-overrides]");
    const css = componentOverridesStore.toCSS();
    if (!css) {
      sheet?.remove();
      return;
    }
    if (!sheet) {
      sheet = document.createElement("style");
      sheet.setAttribute("data-component-overrides", "");
      root.appendChild(sheet);
    }
    sheet.textContent = css;
    this.refreshCanvasComponents();
  }

  /**
   * Repaint every canvas-backed chart after a token change, on a trailing
   * debounce.
   *
   * The delay is doing two jobs. It coalesces the burst of updates a dragged
   * colour picker produces (each repaint destroys and rebuilds nine Chart.js
   * instances, so per-event refreshing is wasteful), and it lets the inline
   * custom-property write settle: refreshing in the same task, or on the next
   * task boundary, measurably re-reads the PREVIOUS computed values and
   * repaints the charts in the colour they already had. requestAnimationFrame
   * is deliberately not used, it never fires while the tab is not painting.
   */
  private refreshCanvasComponents(): void {
    if (this.refreshTimer !== undefined) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = undefined;
      const roots = this.shadowRoot?.querySelectorAll<HTMLElement & { refresh?: () => void }>(
        "fluid-bar-chart, fluid-line-chart, fluid-pie-chart, fluid-doughnut-chart," +
          " fluid-scatter-chart, fluid-bubble-chart, fluid-radar-chart," +
          " fluid-polar-area-chart, fluid-sparkline"
      );
      /*
       * Isolate each repaint: one component throwing (a canvas left in a bad
       * state, say) must not abort the rest of the loop and leave every later
       * chart stale.
       */
      for (const el of roots ?? []) {
        try {
          el.refresh?.();
        } catch (error) {
          console.warn("[playground] chart refresh failed", el.tagName, error);
        }
      }
    }, 120);
  }

  /** Half-hour slots for the booking scene, regenerated per selected day. */
  private bookingSlots(iso: string): Array<{
    start: string;
    end: string;
    remaining: number;
    state: "available" | "full";
  }> {
    const times = ["09:00", "09:30", "10:00", "10:30", "11:00"];
    return times.slice(0, 4).map((time, i) => ({
      start: `${iso}T${time}`,
      end: `${iso}T${times[i + 1]}`,
      // One reliably-full slot so the "unavailable" styling is always visible.
      remaining: i === 2 ? 0 : 1,
      state: i === 2 ? ("full" as const) : ("available" as const)
    }));
  }

  private formatBookingTime(): string {
    return this.bookingTime.slice(11) || "a time";
  }

  override render(): TemplateResult {
    return html`
      <!--
        Layout primitives (page / split-panel / scroller) and the format /
        observer / include helpers are intentionally omitted from the theme
        builder. They have no meaningful visual tokens to customize:
        their docs live in the docs site instead. The coverage check
        exempts these tags via PREVIEW_EXEMPT in
        scripts/check-component-coverage.mjs.
      -->
      <div class="surface">
        <fluid-tabs class="section-tabs" value="forms">
          <fluid-tab slot="nav" panel="forms">Forms</fluid-tab>
          <fluid-tab slot="nav" panel="actions">Actions</fluid-tab>
          <fluid-tab slot="nav" panel="feedback">Feedback</fluid-tab>
          <fluid-tab slot="nav" panel="data">Data</fluid-tab>
          <fluid-tab slot="nav" panel="datagrid">Data grid</fluid-tab>
          <fluid-tab slot="nav" panel="kanban">Kanban</fluid-tab>
          <fluid-tab slot="nav" panel="scheduling">Scheduling</fluid-tab>
          <fluid-tab slot="nav" panel="navigation">Navigation</fluid-tab>
          <fluid-tab slot="nav" panel="overlays">Overlays</fluid-tab>
          <fluid-tab slot="nav" panel="media">Media</fluid-tab>
          <fluid-tab slot="nav" panel="charts">Charts</fluid-tab>
          <fluid-tab slot="nav" panel="marketing">Marketing</fluid-tab>
          <fluid-tab slot="nav" panel="editor">Editor</fluid-tab>
          <fluid-tab slot="nav" panel="nodegraph">Node graph</fluid-tab>
          <fluid-tab slot="nav" panel="maps">Maps</fluid-tab>
          <fluid-tab slot="nav" panel="parser">Parser</fluid-tab>
          <fluid-tab-panel name="forms">
            <!--
              Not a specimen grid: one realistic form that puts every form
              component to work in context. The design-mode inspector still
              selects each component individually.
            -->
            <form
              class="scene"
              aria-label="Event setup demo form"
              @submit=${(e: Event) => e.preventDefault()}
            >
              <div class="scene-head">
                <h3>Set up your launch event</h3>
                <p>One real form, every Fluid form control doing its actual job.</p>
              </div>

              <div class="scene-cols">
                <div class="scene-col">
                  <fluid-fieldset
                    legend="Contact"
                    description="We will only use this to reach you."
                  >
                    <div class="scene-fields">
                      <fluid-field
                        label="Work email"
                        description="We'll never share it."
                        for="pg-form-email"
                      >
                        <fluid-input
                          id="pg-form-email"
                          type="email"
                          placeholder="you@example.com"
                        ></fluid-input>
                      </fluid-field>
                      <fluid-input value="Sarah Chen" aria-label="Full name">
                        <fluid-icon slot="prefix" name="user"></fluid-icon>
                      </fluid-input>
                      <fluid-input placeholder="your-company.com" aria-label="Company website">
                        <span slot="prefix">https://</span>
                        <fluid-icon slot="suffix" name="external-link"></fluid-icon>
                      </fluid-input>
                      <fluid-masked-input
                        mask="(###) ###-####"
                        aria-label="Phone number"
                      ></fluid-masked-input>
                      <fluid-textarea
                        aria-label="Anything we should know?"
                        placeholder="Dietary needs, access requirements…"
                        maxlength="120"
                      ></fluid-textarea>
                    </div>
                  </fluid-fieldset>

                  <fluid-fieldset legend="Event details">
                    <div class="scene-fields">
                      <div class="scene-row">
                        <fluid-select aria-label="Country" value="nl">
                          <fluid-option value="nl">Netherlands</fluid-option>
                          <fluid-option value="be">Belgium</fluid-option>
                          <fluid-option value="de">Germany</fluid-option>
                          <fluid-option value="fr">France</fluid-option>
                        </fluid-select>
                        <fluid-typeahead
                          aria-label="City"
                          placeholder="Search cities…"
                          .options=${[
                            { value: "ams", label: "Amsterdam" },
                            { value: "ant", label: "Antwerp" },
                            { value: "ber", label: "Berlin" },
                            { value: "par", label: "Paris" },
                            { value: "mad", label: "Madrid" },
                            { value: "rom", label: "Rome" },
                            { value: "lon", label: "London" },
                            { value: "nyc", label: "New York" }
                          ]}
                        ></fluid-typeahead>
                      </div>
                      <fluid-radio-group value="md" aria-label="Venue size">
                        <span slot="label">Venue size</span>
                        <fluid-radio value="sm">Up to 50</fluid-radio>
                        <fluid-radio value="md">50 to 250</fluid-radio>
                        <fluid-radio value="lg">250+</fluid-radio>
                      </fluid-radio-group>
                      <div class="scene-checks">
                        <fluid-checkbox checked>Live stream the keynote</fluid-checkbox>
                        <fluid-checkbox>Record breakout sessions</fluid-checkbox>
                        <fluid-checkbox indeterminate>Partner workshops</fluid-checkbox>
                        <fluid-checkbox disabled
                          >Fireworks (not allowed at this venue)</fluid-checkbox
                        >
                      </div>
                      <fluid-switch checked>Email me status updates</fluid-switch>
                      <fluid-switch disabled>SMS alerts (verify a phone number first)</fluid-switch>
                    </div>
                  </fluid-fieldset>

                  <fluid-fieldset legend="Schedule">
                    <div class="scene-fields">
                      <div class="scene-row">
                        <fluid-field label="Announcement day" for="pg-form-announce">
                          <fluid-date-picker
                            id="pg-form-announce"
                            value="2026-06-15"
                          ></fluid-date-picker>
                        </fluid-field>
                        <fluid-field label="Doors open" for="pg-form-doors">
                          <fluid-time-picker id="pg-form-doors" value="09:30"></fluid-time-picker>
                        </fluid-field>
                      </div>
                      <fluid-field label="Event window" for="pg-form-window">
                        <fluid-date-range-picker
                          id="pg-form-window"
                          start="2026-06-08"
                          end="2026-06-19"
                        ></fluid-date-range-picker>
                      </fluid-field>
                    </div>
                  </fluid-fieldset>
                </div>

                <div class="scene-col">
                  <fluid-fieldset legend="Capacity and budget">
                    <div class="scene-fields">
                      <fluid-field label="Seats reserved for press" for="pg-form-seats">
                        <fluid-number-input
                          id="pg-form-seats"
                          aria-label="Seats reserved for press"
                          value="5"
                          min="0"
                          max="20"
                        ></fluid-number-input>
                      </fluid-field>
                      <fluid-field label="Catering budget" for="pg-form-catering">
                        <fluid-slider
                          id="pg-form-catering"
                          value="40"
                          show-value
                          aria-label="Catering budget"
                        ></fluid-slider>
                      </fluid-field>
                      <fluid-field label="Budget per attendee" for="pg-form-budget">
                        <fluid-input
                          id="pg-form-budget"
                          value="85"
                          inputmode="decimal"
                          aria-label="Budget per attendee"
                        >
                          <span slot="prefix">€</span>
                          <span slot="suffix">EUR</span>
                        </fluid-input>
                      </fluid-field>
                      <fluid-field
                        label="VAT number"
                        description="Filled from the company registry."
                        for="pg-form-vat"
                      >
                        <fluid-input
                          id="pg-form-vat"
                          disabled
                          value="NL-8123.44.021"
                          aria-label="VAT number"
                        ></fluid-input>
                      </fluid-field>
                      <fluid-field label="Promo code" for="pg-form-promo">
                        <fluid-input
                          id="pg-form-promo"
                          placeholder="EARLYBIRD"
                          aria-label="Promo code"
                        >
                          <span slot="prefix">#</span>
                        </fluid-input>
                      </fluid-field>
                      <fluid-field label="Ticket price band" for="pg-form-band">
                        <fluid-range-slider
                          id="pg-form-band"
                          value-min="25"
                          value-max="75"
                        ></fluid-range-slider>
                      </fluid-field>
                    </div>
                  </fluid-fieldset>

                  <fluid-fieldset legend="Branding">
                    <div class="scene-fields">
                      <fluid-field label="Accent color" for="pg-form-accent">
                        <fluid-color-picker
                          id="pg-form-accent"
                          value="#3b82f6"
                          .palette=${[
                            "#3b82f6",
                            "#8b5cf6",
                            "#ec4899",
                            "#f97316",
                            "#22c55e",
                            "#06b6d4"
                          ]}
                          aria-label="Accent color"
                        ></fluid-color-picker>
                      </fluid-field>
                      <fluid-field label="Logo" for="pg-form-logo">
                        <fluid-file-input
                          id="pg-form-logo"
                          variant="compact"
                          aria-label="Upload logo"
                        ></fluid-file-input>
                      </fluid-field>
                      <fluid-dropzone
                        multiple
                        accept="image/*"
                        label="Drag press-kit assets here or click to browse"
                      ></fluid-dropzone>
                      <fluid-field label="Sign to approve the artwork" for="pg-form-sign">
                        <fluid-signature-pad
                          id="pg-form-sign"
                          aria-label="Signature"
                        ></fluid-signature-pad>
                      </fluid-field>
                    </div>
                  </fluid-fieldset>

                  <fluid-fieldset legend="Review team">
                    <div class="scene-fields">
                      <fluid-transfer
                        source-label="Available"
                        target-label="Reviewers"
                        .items=${[
                          { id: "amy", label: "Amy Elsner" },
                          { id: "anna", label: "Anna Fali" },
                          { id: "stephen", label: "Stephen Shaw" },
                          { id: "ioni", label: "Ioni Bowcher" }
                        ]}
                        .value=${["anna"]}
                      ></fluid-transfer>
                      <fluid-field label="Session tags" for="pg-form-tags">
                        <fluid-tag-input
                          id="pg-form-tags"
                          aria-label="Session tags"
                          value="react,typescript,lit"
                          placeholder="Add a tag…"
                        ></fluid-tag-input>
                      </fluid-field>
                    </div>
                  </fluid-fieldset>

                  <fluid-fieldset
                    legend="Confirm it's you"
                    description="Enter the 6-digit code we texted you."
                  >
                    <div class="scene-fields">
                      <fluid-otp length="6" value="123" aria-label="One-time code"></fluid-otp>
                    </div>
                  </fluid-fieldset>
                </div>
              </div>

              <div class="scene-foot">
                <span class="scene-foot-note">Nothing is submitted, this is a live demo.</span>
                <span class="scene-foot-actions">
                  <fluid-button variant="ghost">Cancel</fluid-button>
                  <fluid-button variant="secondary">
                    <fluid-icon slot="prefix" name="save"></fluid-icon>
                    Save draft
                  </fluid-button>
                  <fluid-button type="submit">
                    Publish event
                    <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
                  </fluid-button>
                </span>
              </div>
            </form>
          </fluid-tab-panel>
          <fluid-tab-panel name="actions">
            <!-- Composed scene: a document editor. Every action component sits
                 where it would in a real app: formatting group and mode switch
                 in the toolbar, kbd hint + command palette, speed dial floating
                 over the document, copy button on the share link. -->
            <div class="scene">
              <div class="scene-head">
                <h3>Draft: Q3 launch plan</h3>
                <p>An editor surface where every action component earns its place.</p>
              </div>

              <div class="editor">
                <div class="editor-bar">
                  <fluid-button-group aria-label="Text format">
                    <fluid-button variant="secondary">Bold</fluid-button>
                    <fluid-button variant="secondary">Italic</fluid-button>
                    <fluid-button variant="secondary">Underline</fluid-button>
                  </fluid-button-group>
                  <fluid-segmented-control value="edit" aria-label="Editor mode">
                    <fluid-segment value="edit">Edit</fluid-segment>
                    <fluid-segment value="preview">Preview</fluid-segment>
                    <fluid-segment value="split">Split</fluid-segment>
                  </fluid-segmented-control>
                  <span class="editor-bar-spacer"></span>
                  <span class="editor-hint">
                    <fluid-kbd>Ctrl</fluid-kbd> + <fluid-kbd>K</fluid-kbd>
                  </span>
                  <fluid-button
                    variant="ghost"
                    @click=${(e: Event) => {
                      const cp = (e.currentTarget as HTMLElement).nextElementSibling as
                        | (HTMLElement & { show?: () => void })
                        | null;
                      cp?.show?.();
                    }}
                    >Commands</fluid-button
                  >
                  <fluid-command-palette
                    .items=${[
                      { id: "new", label: "New File", hint: "⌘N", group: "File" },
                      { id: "open", label: "Open File…", hint: "⌘O", group: "File" },
                      { id: "copy", label: "Copy", hint: "⌘C", group: "Edit" }
                    ]}
                  ></fluid-command-palette>
                  <fluid-theme-toggle
                    no-persist
                    .brands=${["", "midnight", "corporate"]}
                  ></fluid-theme-toggle>
                </div>

                <div class="editor-doc">
                  <h4>Q3 launch plan</h4>
                  <p>
                    Ship the rebuilt landing page, publish 0.4.0 to npm, and open the theme builder
                    beta to design partners. Rollout is staged per region with a 48-hour observation
                    window between stages.
                  </p>
                  <p>
                    Risks: the visual-review ledger still has open rows, and the RTL fluency review
                    is pending. Both gate the stable tag, neither gates this draft.
                  </p>
                  <fluid-speed-dial class="editor-dial" label="Quick actions" placement="up">
                    <fluid-button variant="ghost" aria-label="Share">Share</fluid-button>
                    <fluid-button variant="ghost" aria-label="Edit">Edit</fluid-button>
                    <fluid-button variant="ghost" aria-label="Delete">Delete</fluid-button>
                  </fluid-speed-dial>
                </div>

                <div class="editor-foot">
                  <span class="share-row">
                    <code>fluid.dev/d/q3-launch</code>
                    <fluid-copy-button
                      value="https://fluid.dev/d/q3-launch"
                      aria-label="Copy share link"
                    ></fluid-copy-button>
                  </span>
                  <span class="scene-foot-actions">
                    <fluid-button variant="ghost">Discard</fluid-button>
                    <fluid-button variant="secondary" disabled>Approve (owner only)</fluid-button>
                    <fluid-button>Publish</fluid-button>
                  </span>
                </div>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="feedback">
            <!-- Composed scene: a release-day status page. Announcement banner,
                 pipeline progress, region rollout, health checks, incidents,
                 and the celebratory finish, every feedback component in its
                 natural habitat. -->
            <div class="scene">
              <fluid-banner variant="info" dismissible>
                Deploy window is open until 18:00 UTC. Non-release merges are frozen.
                <fluid-button slot="actions" variant="primary" size="sm">View plan</fluid-button>
              </fluid-banner>

              <div class="scene-head">
                <h3>Deploying 0.4.0</h3>
                <p>A status page where every feedback component reports something real.</p>
              </div>

              <div class="scene-cols">
                <div class="scene-col">
                  <section class="status-panel">
                    <h4>Pipeline</h4>
                    <fluid-callout variant="info">
                      <span slot="header">Canary first</span>
                      The first hour serves 5% of traffic before the full rollout.
                    </fluid-callout>
                    <div class="status-stack">
                      <fluid-progress-bar value="80" show-value aria-label="Build 80%"
                        >Build</fluid-progress-bar
                      >
                      <fluid-progress-bar value="35" show-value aria-label="Upload 35%"
                        >Upload artifacts</fluid-progress-bar
                      >
                      <fluid-progress-bar
                        indeterminate
                        aria-label="Publishing to the registry"
                      ></fluid-progress-bar>
                    </div>
                    <div class="status-rings">
                      <span class="ring-item">
                        <fluid-progress-ring
                          value="92"
                          show-value
                          aria-label="EU rollout 92%"
                        ></fluid-progress-ring>
                        EU
                      </span>
                      <span class="ring-item">
                        <fluid-progress-ring
                          value="60"
                          show-value
                          style="--fluid-progress-ring-size: 4.5rem;"
                          aria-label="US rollout 60%"
                        ></fluid-progress-ring>
                        US
                      </span>
                      <span class="ring-item">
                        <fluid-progress-ring
                          value="25"
                          show-value
                          aria-label="APAC rollout 25%"
                        ></fluid-progress-ring>
                        APAC
                      </span>
                    </div>
                    <fluid-meter
                      value="72"
                      low="33"
                      high="66"
                      optimum="20"
                      show-value
                      label="Build agent disk"
                      >Build agent disk</fluid-meter
                    >
                    <div class="status-badges">
                      <fluid-badge>queued</fluid-badge>
                      <fluid-badge variant="info">running</fluid-badge>
                      <fluid-badge variant="success">passed</fluid-badge>
                      <fluid-badge variant="warning">flaky</fluid-badge>
                      <fluid-badge variant="danger">failed</fluid-badge>
                    </div>
                    <div class="status-count">
                      <span>Change freeze lifts in</span>
                      <fluid-countdown seconds="3661" format="clock"></fluid-countdown>
                    </div>
                  </section>
                </div>

                <div class="scene-col">
                  <section class="status-panel">
                    <h4>Health checks</h4>
                    <fluid-loading-overlay active label="Running smoke tests…">
                      <div class="status-inner-card">
                        <h5>Smoke tests</h5>
                        <p>231 browser SSR and hydration cases run against the canary.</p>
                      </div>
                    </fluid-loading-overlay>
                    <div class="status-inner-card">
                      <h5>Changelog preview</h5>
                      <div class="status-stack">
                        <fluid-skeleton style="height: 1rem; width: 70%;"></fluid-skeleton>
                        <fluid-skeleton style="height: 0.75rem;"></fluid-skeleton>
                        <fluid-skeleton style="height: 0.75rem; width: 85%;"></fluid-skeleton>
                      </div>
                    </div>
                    <span class="status-live">
                      <fluid-spinner></fluid-spinner>
                      Streaming deploy logs…
                    </span>
                    <fluid-empty-state heading="No incidents reported">
                      Error budget untouched. This panel fills if a probe fails.
                    </fluid-empty-state>
                  </section>

                  <section class="status-panel">
                    <fluid-result
                      status="success"
                      title="Staging deploy complete"
                      subtitle="All 24 visitor journeys passed against the staged build."
                    >
                      <fluid-button slot="actions" variant="primary"
                        >Promote to production</fluid-button
                      >
                      <fluid-button slot="actions" variant="secondary">View logs</fluid-button>
                    </fluid-result>
                  </section>
                </div>
              </div>

              <div class="scene-foot">
                <span class="status-rate">
                  How did this release go?
                  <fluid-rating
                    value="3.5"
                    precision="0.5"
                    aria-label="Rate this release"
                  ></fluid-rating>
                </span>
                <span class="scene-foot-actions">
                  <fluid-button
                    variant="secondary"
                    @click=${(e: Event) => {
                      const stack = (e.target as HTMLElement)
                        .closest(".scene")!
                        .querySelector<
                          HTMLElement & { toast: (o: { message: string; variant: string }) => void }
                        >("fluid-toast");
                      stack?.toast({
                        message: "Deploy note posted to #releases",
                        variant: "success"
                      });
                    }}
                  >
                    Notify team
                  </fluid-button>
                  <fluid-popconfirm
                    message="Roll back to 0.3.8? Traffic shifts within a minute."
                    confirm-text="Roll back"
                    tone="danger"
                  >
                    <fluid-button slot="trigger" variant="secondary" tone="danger"
                      >Roll back</fluid-button
                    >
                  </fluid-popconfirm>
                  <fluid-button
                    variant="primary"
                    @click=${(e: Event) => {
                      const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                      root.querySelector<HTMLElement & { fire(): void }>("#pg-celebrate")?.fire();
                    }}
                    >Mark release complete 🎉</fluid-button
                  >
                  <!-- Declarative wrapper around the effects API. Renders nothing
                       (display: contents); fire() paints on the shared overlay. -->
                  <fluid-celebrate
                    id="pg-celebrate"
                    effect="confetti"
                    origin="self"
                  ></fluid-celebrate>
                </span>
                <fluid-toast placement="top-end"></fluid-toast>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="data">
            <!-- Composed scene: a project workspace. Stats, README, tables,
                 activity, metadata: every data-display component presenting
                 real-shaped content instead of specimen boxes. -->
            <div class="scene scene-wide">
              <div class="scene-head-row">
                <div class="scene-head">
                  <h3>acme / checkout-service</h3>
                  <p>A workspace page where every data component displays something real.</p>
                </div>
                <div class="scene-head-side">
                  <fluid-avatar-group max="3">
                    <fluid-avatar label="Ada Lovelace"></fluid-avatar>
                    <fluid-avatar label="Grace Hopper"></fluid-avatar>
                    <fluid-avatar label="Alan Turing"></fluid-avatar>
                    <fluid-avatar label="Katherine Johnson"></fluid-avatar>
                    <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
                  </fluid-avatar-group>
                  <div class="scene-tags">
                    <fluid-tag variant="info">payments</fluid-tag>
                    <fluid-tag variant="success">production</fluid-tag>
                    <fluid-tag>typescript</fluid-tag>
                    <fluid-tag removable>beta</fluid-tag>
                  </div>
                </div>
              </div>

              <div class="data-stats">
                <fluid-card>
                  <fluid-stat
                    label="Weekly downloads"
                    value="48.2k"
                    change="+12%"
                    trend="up"
                  ></fluid-stat>
                </fluid-card>
                <fluid-card>
                  <fluid-stat label="Open issues" value="23" change="-8%" trend="down"></fluid-stat>
                </fluid-card>
                <fluid-card>
                  <fluid-stat label="Contributors" value="87" change="+3" trend="up"></fluid-stat>
                </fluid-card>
              </div>

              <div class="scene-cols">
                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">README</h3>
                    <fluid-markdown
                      value="### checkout-service

Handles carts, payment intents and settlement webhooks for the storefront. Built with **Fluid** components on the admin side:

- idempotent payment intents
- multi-currency settlement
- webhook retry with backoff"
                    ></fluid-markdown>
                    <fluid-fold label="Show install guide" open-label="Hide install guide">
                      <fluid-code-block
                        language="bash"
                        code="pnpm add @acme/checkout-service
pnpm exec checkout migrate && pnpm exec checkout dev"
                      ></fluid-code-block>
                    </fluid-fold>
                    <fluid-button slot="footer" size="sm" variant="secondary"
                      >View on GitHub</fluid-button
                    >
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Contributors</h3>
                    <fluid-table
                      caption="Contributors"
                      hide-caption
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
                    <h3 slot="header">Dashboard redesign</h3>
                    <fluid-comparison
                      style="border-radius: var(--fluid-radius-md); overflow: hidden;"
                    >
                      <div
                        slot="before"
                        style="aspect-ratio:16/9; background:#475569; color:white; display:flex; align-items:center; justify-content:center;"
                      >
                        Before
                      </div>
                      <div
                        slot="after"
                        style="aspect-ratio:16/9; background:#0ea5e9; color:white; display:flex; align-items:center; justify-content:center;"
                      >
                        After
                      </div>
                    </fluid-comparison>
                  </fluid-card>
                </div>

                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">About</h3>
                    <div class="about-owner">
                      <fluid-avatar size="lg" label="Ada Lovelace"></fluid-avatar>
                      <div>
                        <strong>Ada Lovelace</strong>
                        <small>Project owner</small>
                      </div>
                    </div>
                    <fluid-description-list columns="2" divider aria-label="Project details">
                      <fluid-description-item>
                        <span slot="term">License</span>
                        MIT
                      </fluid-description-item>
                      <fluid-description-item>
                        <span slot="term">Created</span>
                        March 2021
                      </fluid-description-item>
                      <fluid-description-item>
                        <span slot="term">Latest release</span>
                        0.4.0
                      </fluid-description-item>
                      <fluid-description-item>
                        <span slot="term">Registry</span>
                        npm
                      </fluid-description-item>
                    </fluid-description-list>
                    <fluid-truncate lines="3">
                      checkout-service began as a hack-week rewrite of the legacy cart API and grew
                      into the storefront's system of record for orders. It owns payment intents end
                      to end, reconciles settlements nightly, and feeds the finance warehouse. The
                      service is deployed per region with a shared control plane and is the
                      reference implementation for our idempotency guidelines.
                    </fluid-truncate>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Release activity</h3>
                    <fluid-timeline aria-label="Release activity">
                      <fluid-timeline-item
                        ><span slot="time">09:24</span
                        ><strong>0.4.0 tagged</strong></fluid-timeline-item
                      >
                      <fluid-timeline-item tone="info"
                        ><span slot="time">10:02</span
                        ><strong>CI matrix green</strong></fluid-timeline-item
                      >
                      <fluid-timeline-item tone="success"
                        ><span slot="time">14:51</span
                        ><strong>Published to npm</strong></fluid-timeline-item
                      >
                    </fluid-timeline>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Files</h3>
                    <fluid-tree>
                      <fluid-tree-item expanded>
                        src
                        <fluid-tree-item>intents.ts</fluid-tree-item>
                        <fluid-tree-item>settlement.ts</fluid-tree-item>
                      </fluid-tree-item>
                      <fluid-tree-item>docs</fluid-tree-item>
                    </fluid-tree>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Maintainers</h3>
                    <fluid-list label="Maintainers" divided>
                      <fluid-list-item>
                        <fluid-avatar slot="leading" size="sm" label="Ada Lovelace"></fluid-avatar>
                        Ada Lovelace
                        <span slot="description">Owner</span>
                        <span slot="trailing">Admin</span>
                      </fluid-list-item>
                      <fluid-list-item interactive>
                        <fluid-avatar slot="leading" size="sm" label="Grace Hopper"></fluid-avatar>
                        Grace Hopper
                        <span slot="description">Release manager</span>
                      </fluid-list-item>
                      <fluid-list-item href="#docs">
                        Maintainer guide
                        <span slot="trailing">→</span>
                      </fluid-list-item>
                    </fluid-list>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Open on mobile</h3>
                    <div class="qr-row">
                      <fluid-qr-code
                        value="https://fluid-ds.example.com"
                        size="120"
                        module-shape="dots"
                        eye-shape="rounded"
                        eye-color="var(--fluid-accent-base)"
                        logo="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%234f46e5'/%3E%3Ctext x='24' y='32' font-size='26' font-family='sans-serif' fill='white' text-anchor='middle'%3EF%3C/text%3E%3C/svg%3E"
                        logo-size="0.24"
                      ></fluid-qr-code>
                      <p>Scan to open this workspace on your phone.</p>
                    </div>
                  </fluid-card>
                </div>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="datagrid">
            <!-- Dedicated stage for the advanced data grid: column reorder
                 (drag or keyboard grab), resize grips, the column
                 configurator, container scrolling and infinite loading. -->
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Operational data grid</h3>
                <p>
                  Drag a header (or grab it with the keyboard) to reorder, pull the grips to resize,
                  and open the configurator to hide columns. 640 results stream in as you scroll.
                </p>
              </div>
              <fluid-card>
                <h3 slot="header">CI runners</h3>
                <fluid-infinite-table
                  caption="CI runners"
                  hide-caption
                  configurable
                  reorderable-columns
                  resizable-columns
                  scroll-mode="container"
                  column-scroll
                  style="--fluid-infinite-table-height:26rem"
                  .columns=${[
                    {
                      key: "terminal",
                      label: "Runner",
                      width: "13rem",
                      sortable: true,
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<strong>${row.terminal}</strong><br /><small>${row.serial}</small>`
                    },
                    {
                      key: "status",
                      label: "Status",
                      width: "7.5rem",
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<fluid-badge variant=${row.online ? "success" : "danger"}>
                          ${row.online ? "Online" : "Offline"}
                        </fluid-badge>`
                    },
                    {
                      key: "owner",
                      label: "Owner",
                      width: "12rem",
                      sortable: true,
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<span style="display:inline-flex;align-items:center;gap:0.5rem;">
                          <fluid-avatar size="sm" label=${String(row.owner)}></fluid-avatar>
                          ${row.owner}
                        </span>`
                    },
                    { key: "site", label: "Site", width: "10rem", sortable: true },
                    {
                      key: "pipeline",
                      label: "Pipeline",
                      width: "9rem",
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<fluid-tag size="sm" variant=${row.pipelineTone}
                          >${row.pipeline}</fluid-tag
                        >`
                    },
                    {
                      key: "load",
                      label: "Load",
                      width: "10rem",
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<fluid-progress-bar
                          value=${Number(row.load)}
                          show-value
                          aria-label=${`Load ${row.load}%`}
                        ></fluid-progress-bar>`
                    },
                    { key: "queue", label: "Queue", width: "6.5rem", align: "end", sortable: true },
                    {
                      key: "jobs",
                      label: "Jobs today",
                      width: "8rem",
                      align: "end",
                      sortable: true
                    },
                    {
                      key: "duration",
                      label: "Avg build",
                      width: "8.5rem",
                      align: "end",
                      sortable: true
                    },
                    {
                      key: "version",
                      label: "Agent",
                      width: "8rem",
                      renderCell: ({ row }: FluidInfiniteTableCellContext) =>
                        html`<code
                          style="font-family:var(--fluid-font-family-mono);font-size:var(--fluid-font-size-xs);"
                          >${row.version}</code
                        >`
                    },
                    { key: "lastBuild", label: "Last build", width: "9rem", sortable: true },
                    {
                      key: "actions",
                      label: "",
                      width: "4rem",
                      align: "center",
                      configurable: false,
                      resizable: false,
                      renderCell: () =>
                        html`<fluid-button variant="ghost" size="sm" aria-label="Runner actions"
                          ><fluid-icon name="ellipsis"></fluid-icon
                        ></fluid-button>`
                    }
                  ]}
                  .rows=${Array.from({ length: 20 }, (_, index) => {
                    const online = index % 6 !== 0;
                    const pipelines = [
                      { label: "release", tone: "success" },
                      { label: "nightly", tone: "info" },
                      { label: "canary", tone: "warning" },
                      { label: "hotfix", tone: "danger" }
                    ];
                    const pipeline = pipelines[index % pipelines.length]!;
                    return {
                      id: index,
                      online,
                      terminal: `Apollo ${index + 1}`,
                      serial: `APL2026${String(index + 1).padStart(5, "0")}`,
                      owner: ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson"][
                        index % 4
                      ],
                      site: ["Amsterdam", "Rotterdam", "Utrecht"][index % 3],
                      pipeline: pipeline.label,
                      pipelineTone: pipeline.tone,
                      load: online ? 12 + ((index * 17) % 84) : 0,
                      queue: online ? (index * 3) % 14 : 0,
                      jobs: 40 + ((index * 29) % 260),
                      duration: `${2 + (index % 9)}m ${(index * 7) % 60}s`,
                      version: `v2.${4 + (index % 3)}.${index % 10}`,
                      lastBuild: online ? `${1 + (index % 58)} min ago` : "3 days ago"
                    };
                  })}
                  .total=${640}
                  has-more
                >
                  <span slot="filters">Projected filters</span>
                </fluid-infinite-table>
              </fluid-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="kanban">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Sprint board</h3>
                <p>Drag cards between columns, or move them with the keyboard alone.</p>
              </div>
              <preview-card label="Kanban">
                <fluid-kanban
                  .columns=${[
                    {
                      id: "todo",
                      title: "To do",
                      cards: [
                        { id: "c1", title: "Draft the spec" },
                        { id: "c2", title: "Set up CI" }
                      ]
                    },
                    {
                      id: "doing",
                      title: "In progress",
                      cards: [{ id: "c3", title: "Build the board" }]
                    },
                    { id: "done", title: "Done", cards: [{ id: "c4", title: "Kickoff" }] }
                  ]}
                ></fluid-kanban>
              </preview-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="scheduling">
            <!-- Composed scene: a booking console. Pick a day, pick a slot,
                 confirm; the month view and the availability editor are the
                 admin side of the same workflow. -->
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Booking console</h3>
                <p>Pick a day, pick a slot, then manage the calendar behind it.</p>
              </div>

              <div class="booking booking-flow">
                <fluid-card class="booking-pick">
                  <h3 slot="header">1. Pick a day</h3>
                  <fluid-calendar
                    .value=${this.bookingDay}
                    aria-label="Choose a day"
                    @fluid-date-activate=${(e: CustomEvent) => {
                      this.bookingDay = String(e.detail.iso);
                      this.bookingTime = `${e.detail.iso}T09:30`;
                    }}
                  ></fluid-calendar>
                </fluid-card>

                <fluid-card class="booking-slots">
                  <h3 slot="header">2. Pick a time</h3>
                  <fluid-time-slots
                    .date=${this.bookingDay}
                    .slots=${this.bookingSlots(this.bookingDay)}
                    .value=${this.bookingTime}
                    no-heading
                    @fluid-change=${(e: CustomEvent) => {
                      this.bookingTime = String(e.detail.value);
                    }}
                  ></fluid-time-slots>
                  <fluid-button slot="footer"
                    >Confirm ${this.bookingDay} at ${this.formatBookingTime()}</fluid-button
                  >
                </fluid-card>
              </div>

              <fluid-card>
                <h3 slot="header">Self-serve booking page</h3>
                <fluid-scheduler
                  .availability=${{
                    weekly: {
                      1: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "17:00" }
                      ],
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

              <div class="booking">
                <fluid-card>
                  <h3 slot="header">Team calendar</h3>
                  <fluid-event-calendar
                    .month=${"2026-06"}
                    .events=${[
                      { id: "1", date: "2026-06-03", title: "Standup", tone: "accent" },
                      { id: "2", date: "2026-06-10", title: "Release cut", tone: "warning" },
                      { id: "3", date: "2026-06-15", title: "Consultation", tone: "accent" },
                      { id: "4", date: "2026-06-25", title: "Demo day", tone: "success" }
                    ]}
                    week-start="1"
                  ></fluid-event-calendar>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Your working hours</h3>
                  <fluid-availability-editor
                    .availability=${{
                      weekly: {
                        1: [{ start: "09:00", end: "17:00" }],
                        2: [{ start: "09:00", end: "17:00" }]
                      },
                      slotMinutes: 30
                    }}
                  ></fluid-availability-editor>
                </fluid-card>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="navigation">
            <!-- Composed scene: a documentation app frame. App bar on top,
                 sidebar + nav list at the left, page nav (breadcrumb, tabs,
                 steps, accordion, pagination) through the middle, and the
                 anchor nav tracking headings on the right. -->
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Docs application frame</h3>
                <p>Every navigation component wired into one page, in the role it was built for.</p>
              </div>

              <div class="appframe">
                <fluid-app-bar menu-button>
                  <strong slot="start">Acme Docs</strong>
                  <a href="#" style="color: inherit;">Guides</a>
                  <a href="#" style="color: inherit;">Components</a>
                  <a href="#" style="color: inherit;">API</a>
                  <span slot="end">Sign in</span>
                </fluid-app-bar>

                <div class="appframe-body">
                  <fluid-sidebar aria-label="Documentation sections" collapsible>
                    <strong slot="header">Fluid</strong>
                    <fluid-nav-list label="Documentation">
                      <fluid-nav-item href="#dashboard" current>Getting started</fluid-nav-item>
                      <fluid-nav-item href="#components">Components</fluid-nav-item>
                      <fluid-nav-item href="#theming">Theming</fluid-nav-item>
                      <fluid-nav-item href="#settings">Migration</fluid-nav-item>
                    </fluid-nav-list>
                    <small slot="footer">v0.4.0</small>
                  </fluid-sidebar>

                  <main class="appframe-main">
                    <fluid-breadcrumb>
                      <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
                      <fluid-breadcrumb-item href="/components">Components</fluid-breadcrumb-item>
                      <fluid-breadcrumb-item>Avatar</fluid-breadcrumb-item>
                    </fluid-breadcrumb>

                    <div class="appframe-title">
                      <h4 id="demo-intro">Avatar</h4>
                      <fluid-toolbar aria-label="Page actions">
                        <fluid-button variant="ghost">Edit page</fluid-button>
                        <fluid-button variant="ghost">Share</fluid-button>
                        <fluid-button variant="ghost">Report issue</fluid-button>
                      </fluid-toolbar>
                    </div>

                    <fluid-tabs value="overview" style="width:100%;">
                      <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
                      <fluid-tab slot="nav" panel="api">API</fluid-tab>
                      <fluid-tab-panel name="overview"
                        >A circular image or initials representing a person or entity. Adjust tokens
                        to see styles flow through.</fluid-tab-panel
                      >
                      <fluid-tab-panel name="api"
                        >Properties, slots and CSS custom properties for the active
                        brand.</fluid-tab-panel
                      >
                    </fluid-tabs>

                    <section class="appframe-section">
                      <h5 id="demo-install">Set-up progress</h5>
                      <fluid-steps current="1" aria-label="Set-up progress" style="width:100%;">
                        <fluid-step description="Add the package">Install</fluid-step>
                        <fluid-step description="Import the tokens">Theme</fluid-step>
                        <fluid-step description="Render a component">Use</fluid-step>
                      </fluid-steps>
                    </section>

                    <section class="appframe-section">
                      <h5 id="demo-config">Frequently asked</h5>
                      <fluid-accordion>
                        <fluid-details open>
                          <span slot="summary">Does it work without a framework?</span>
                          <p>
                            Yes. They are standard custom elements; drop the tags into any page.
                          </p>
                        </fluid-details>
                        <fluid-details>
                          <span slot="summary">Can I theme one instance only?</span>
                          <p>
                            Set the component tokens on that element, or isolate it here in the
                            builder.
                          </p>
                        </fluid-details>
                      </fluid-accordion>
                    </section>

                    <section class="appframe-section">
                      <h5 id="demo-usage">Related pages</h5>
                      <fluid-context-menu
                        aria-label="Page actions"
                        .items=${[
                          { label: "Open in new tab", value: "open" },
                          { label: "Copy link", value: "copy" },
                          { label: "Print", value: "print", disabled: true },
                          { label: "", value: "", divider: true },
                          { label: "Remove from list", value: "delete" }
                        ]}
                      >
                        <div slot="trigger" tabindex="0" class="appframe-related">
                          Right-click a related page (or press Shift+F10)
                        </div>
                      </fluid-context-menu>
                      <fluid-pagination total-pages="20" page="4"></fluid-pagination>
                    </section>
                  </main>

                  <aside class="appframe-aside">
                    <span class="appframe-aside-label">On this page</span>
                    <fluid-anchor-nav
                      .items=${[
                        { id: "demo-intro", label: "Avatar", level: 2 },
                        { id: "demo-install", label: "Set-up progress", level: 2 },
                        { id: "demo-config", label: "Frequently asked", level: 3 },
                        { id: "demo-usage", label: "Related pages", level: 2 }
                      ]}
                    ></fluid-anchor-nav>
                    <span class="appframe-aside-label">Account</span>
                    <fluid-menu aria-label="Account menu">
                      <fluid-menu-label>Account</fluid-menu-label>
                      <fluid-menu-item value="profile">Profile</fluid-menu-item>
                      <fluid-menu-item value="billing">Billing</fluid-menu-item>
                      <fluid-menu-item value="delete" disabled>Delete account</fluid-menu-item>
                      <fluid-menu-item value="logout">Sign out</fluid-menu-item>
                    </fluid-menu>
                  </aside>
                </div>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="overlays">
            <!-- Composed scene: a workspace settings page. Overlays are
                 triggered things, so each one is opened from the control that
                 would really open it: a help tooltip, a tour launcher, an
                 actions dropdown, a filters drawer, inline popover help, an
                 anchored popup, and a destructive dialog. The open handlers
                 resolve targets through getRootNode() because this whole scene
                 lives inside component-preview's shadow root. -->
            <div class="scene scene-wide">
              <div class="scene-head-row">
                <div class="scene-head">
                  <h3>Workspace settings</h3>
                  <p>Every overlay opened from the place it would really be opened from.</p>
                </div>
                <div class="settings-actions">
                  <fluid-tooltip content="Keyboard shortcuts (Ctrl + /)">
                    <fluid-button variant="ghost" aria-label="Keyboard shortcuts">
                      <fluid-icon name="circle-help"></fluid-icon>
                    </fluid-button>
                  </fluid-tooltip>
                  <fluid-button
                    id="pg-tour-start"
                    variant="secondary"
                    @click=${(e: Event) => {
                      const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                      root.querySelector<HTMLElement & { show(): void }>("#pg-tour")?.show();
                    }}
                    >Take a tour</fluid-button
                  >
                  <fluid-dropdown>
                    <fluid-button slot="trigger">
                      Actions
                      <fluid-icon slot="suffix" name="chevron-down"></fluid-icon>
                    </fluid-button>
                    <fluid-dropdown-item value="rename">Rename workspace</fluid-dropdown-item>
                    <fluid-dropdown-item value="duplicate">Duplicate</fluid-dropdown-item>
                    <fluid-dropdown-item value="export">Export settings</fluid-dropdown-item>
                    <fluid-dropdown-item type="separator"></fluid-dropdown-item>
                    <fluid-dropdown-item value="archive">Archive</fluid-dropdown-item>
                  </fluid-dropdown>
                </div>
              </div>

              <div class="settings-bar">
                <fluid-input
                  id="pg-tour-search"
                  placeholder="Search settings"
                  aria-label="Search settings"
                >
                  <fluid-icon slot="prefix" name="search"></fluid-icon>
                </fluid-input>
                <fluid-button id="pg-tour-new" variant="secondary">New project</fluid-button>
                <fluid-button
                  variant="secondary"
                  @click=${(e: Event) => {
                    const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                    root
                      .querySelector<HTMLElement & { show(): void }>("#pg-filters-drawer")
                      ?.show();
                  }}
                >
                  <fluid-icon slot="prefix" name="filter"></fluid-icon>
                  Filters
                </fluid-button>
              </div>

              <div class="scene-cols">
                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">General</h3>
                    <div class="settings-rows">
                      <div class="settings-row">
                        <span class="settings-label">
                          Workspace visibility
                          <fluid-popover placement="bottom-start">
                            <fluid-button
                              slot="trigger"
                              variant="ghost"
                              size="sm"
                              aria-label="About workspace visibility"
                            >
                              <fluid-icon name="circle-help"></fluid-icon>
                            </fluid-button>
                            <strong>Who can see this workspace</strong>
                            <p style="margin: var(--fluid-space-2) 0 0;">
                              Private keeps it to invited members. Outside-click or Escape closes
                              this popover.
                            </p>
                          </fluid-popover>
                        </span>
                        <fluid-segmented-control value="private" aria-label="Workspace visibility">
                          <fluid-segment value="private">Private</fluid-segment>
                          <fluid-segment value="team">Team</fluid-segment>
                          <fluid-segment value="public">Public</fluid-segment>
                        </fluid-segmented-control>
                      </div>

                      <div class="settings-row">
                        <span class="settings-label">
                          Weekly digest
                          <fluid-popover placement="bottom-start">
                            <fluid-button
                              slot="trigger"
                              variant="ghost"
                              size="sm"
                              aria-label="About the weekly digest"
                            >
                              <fluid-icon name="circle-help"></fluid-icon>
                            </fluid-button>
                            <strong>Monday morning summary</strong>
                            <p style="margin: var(--fluid-space-2) 0 0;">
                              Activity, open reviews and rollout status for every project you
                              follow.
                            </p>
                          </fluid-popover>
                        </span>
                        <fluid-switch checked>Enabled</fluid-switch>
                      </div>
                    </div>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Deployment region</h3>
                    <p class="settings-note">
                      The region picker is an anchored popup: raw positioning, your own content.
                    </p>
                    <div style="position: relative; min-height: 8rem;">
                      <fluid-popup placement="bottom-start" distance="8">
                        <fluid-button
                          slot="anchor"
                          variant="secondary"
                          @click=${(e: Event) => {
                            const popup = (e.currentTarget as HTMLElement).closest(
                              "fluid-popup"
                            ) as (HTMLElement & { open: boolean }) | null;
                            if (popup) popup.open = !popup.open;
                          }}
                        >
                          eu-west-1
                          <fluid-icon slot="suffix" name="chevron-down"></fluid-icon>
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
                          <strong>Available regions</strong>
                          <p style="margin: var(--fluid-space-1) 0 0;">
                            eu-west-1, us-east-1, ap-southeast-2. Positioned with floating-ui.
                          </p>
                        </div>
                      </fluid-popup>
                    </div>
                  </fluid-card>
                </div>

                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">Members</h3>
                    <fluid-list label="Workspace members" divided>
                      <fluid-list-item>
                        <fluid-avatar slot="leading" size="sm" label="Ada Lovelace"></fluid-avatar>
                        Ada Lovelace
                        <span slot="description">Owner</span>
                      </fluid-list-item>
                      <fluid-list-item>
                        <fluid-avatar slot="leading" size="sm" label="Grace Hopper"></fluid-avatar>
                        Grace Hopper
                        <span slot="description">Admin</span>
                      </fluid-list-item>
                    </fluid-list>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Danger zone</h3>
                    <p class="settings-note">
                      Deleting a workspace removes every project, deploy history and API key it
                      owns. This cannot be undone.
                    </p>
                    <fluid-button
                      tone="danger"
                      variant="secondary"
                      @click=${(e: Event) => {
                        const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                        root
                          .querySelector<HTMLElement & { show(): void }>("#pg-delete-dialog")
                          ?.show();
                      }}
                    >
                      Delete workspace
                    </fluid-button>
                  </fluid-card>
                </div>
              </div>

              <fluid-dialog id="pg-delete-dialog">
                <span slot="label">Delete this workspace?</span>
                <p>
                  Every project, deploy history and API key in this workspace is removed
                  permanently.
                </p>
                <div slot="footer">
                  <fluid-button variant="ghost">Cancel</fluid-button>
                  <fluid-button tone="danger">Delete workspace</fluid-button>
                </div>
              </fluid-dialog>

              <fluid-drawer id="pg-filters-drawer" placement="end">
                <span slot="label">Filters</span>
                <div class="settings-rows">
                  <fluid-checkbox checked>Only my projects</fluid-checkbox>
                  <fluid-checkbox>Archived</fluid-checkbox>
                  <fluid-checkbox>Has open reviews</fluid-checkbox>
                </div>
              </fluid-drawer>

              <fluid-tour
                id="pg-tour"
                .steps=${[
                  {
                    target: "#pg-tour-search",
                    title: "Search everything",
                    body: "Jump to any setting from here.",
                    placement: "bottom-start"
                  },
                  {
                    target: "#pg-tour-new",
                    title: "Create in one click",
                    body: "Start a new project without leaving settings.",
                    placement: "bottom"
                  }
                ]}
              ></fluid-tour>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="media">
            <!-- Composed scene: a launch press kit. Every media component
                 carries a real asset in the role it would play on a press
                 page: cover art, the launch film, a screenshot carousel, a
                 zoomable diagram, the audio announcement and a photo gallery. -->
            <div class="scene scene-wide">
              <div class="scene-head-row">
                <div class="scene-head">
                  <h3>Launch press kit</h3>
                  <p>Everything a journalist needs, assembled from the media components.</p>
                </div>
                <div class="settings-actions">
                  <fluid-tag variant="info">0.4.0</fluid-tag>
                  <fluid-button variant="secondary">
                    <fluid-icon slot="prefix" name="download"></fluid-icon>
                    Download all assets
                  </fluid-button>
                </div>
              </div>

              <figure class="media-hero">
                <fluid-image
                  src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&q=80"
                  alt="A scenic mountain landscape at dusk"
                  aspect-ratio="21/9"
                  placeholder="#e4e4e7"
                  style="width: 100%;"
                ></fluid-image>
                <figcaption>
                  Cover art, 4000 × 1714, CC-BY. Lazy-loaded with a placeholder tint.
                </figcaption>
              </figure>

              <div class="scene-cols">
                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">Launch film</h3>
                    <fluid-video
                      src="/media/sample-clip-1.webm"
                      muted
                      plays-inline
                      style="width: 100%;"
                    ></fluid-video>
                    <p class="settings-note" style="margin: var(--fluid-space-3) 0 0;">
                      Locally generated sample clip &middot; silent &middot; 6 s
                    </p>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Product screenshots</h3>
                    <fluid-carousel style="--fluid-carousel-aspect-ratio: 16 / 9;">
                      <fluid-carousel-item>
                        <div
                          style="height:100%; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white;"
                        >
                          Dashboard
                        </div>
                      </fluid-carousel-item>
                      <fluid-carousel-item>
                        <div
                          style="height:100%; display:flex; align-items:center; justify-content:center; background:#0891b2; color:white;"
                        >
                          Theme builder
                        </div>
                      </fluid-carousel-item>
                      <fluid-carousel-item>
                        <div
                          style="height:100%; display:flex; align-items:center; justify-content:center; background:#db2777; color:white;"
                        >
                          Data grid
                        </div>
                      </fluid-carousel-item>
                    </fluid-carousel>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Architecture diagram</h3>
                    <p class="settings-note">Scroll to zoom, drag to pan.</p>
                    <fluid-zoomable-frame style="height: 16rem;">
                      <img
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200"
                        alt="Architecture diagram"
                        style="max-width: 100%; display: block;"
                      />
                    </fluid-zoomable-frame>
                  </fluid-card>
                </div>

                <div class="scene-col">
                  <fluid-card>
                    <h3 slot="header">Watch the series</h3>
                    <fluid-video-playlist
                      .entries=${[
                        { title: "Chapter 1: Setup", src: "/media/sample-clip-1.webm" },
                        { title: "Chapter 2: Theming", src: "/media/sample-clip-2.webm" }
                      ]}
                    ></fluid-video-playlist>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Announcement audio</h3>
                    <p class="settings-note">Founder interview, cleared for broadcast.</p>
                    <fluid-audio label="Launch announcement"></fluid-audio>
                  </fluid-card>

                  <fluid-card>
                    <h3 slot="header">Brand loop</h3>
                    <p class="settings-note">
                      Animated assets stay paused until played, honoring reduced motion.
                    </p>
                    <fluid-animated-image
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif"
                      alt="Rotating Earth"
                      style="max-width: 12rem;"
                    ></fluid-animated-image>
                  </fluid-card>
                </div>
              </div>

              <fluid-card>
                <h3 slot="header">Photo gallery</h3>
                <p class="settings-note">
                  Click a thumbnail to open the lightbox; arrow keys move between shots.
                </p>
                <fluid-lightbox loop>
                  <img
                    src="https://picsum.photos/seed/fluid1/240/240"
                    alt="Team at the launch event"
                  />
                  <img src="https://picsum.photos/seed/fluid2/240/240" alt="Workshop session" />
                  <img src="https://picsum.photos/seed/fluid3/240/240" alt="Office exterior" />
                  <img src="https://picsum.photos/seed/fluid4/240/240" alt="Keynote stage" />
                </fluid-lightbox>
              </fluid-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="charts">
            <!--
              Composed scene: an analytics board. Note what is NOT here: no
              hard-coded hex colours. The charts package assigns series colours
              from the brand ramp (--fluid-color-brand-*) and the accent track,
              so every chart on this board re-themes with the tokens on the
              left. Passing literal colours (as the old specimen cards did)
              opts out of theming entirely, which is the one thing a theme
              builder must never demonstrate.
            -->
            <div class="scene scene-wide">
              <div class="scene-head-row">
                <div class="scene-head">
                  <h3>Analytics</h3>
                  <p>Every series colour comes from your tokens; edit the palette and watch.</p>
                </div>
                <div class="settings-actions">
                  <fluid-segmented-control value="30d" aria-label="Reporting range">
                    <fluid-segment value="7d">7 days</fluid-segment>
                    <fluid-segment value="30d">30 days</fluid-segment>
                    <fluid-segment value="12m">12 months</fluid-segment>
                  </fluid-segmented-control>
                  <fluid-button variant="secondary">
                    <fluid-icon slot="prefix" name="download"></fluid-icon>
                    Export
                  </fluid-button>
                </div>
              </div>

              <fluid-card>
                <div class="chart-headline">
                  <span>
                    <span class="chart-headline-label">Monthly recurring revenue</span>
                    <strong class="chart-headline-value">$48.2k</strong>
                  </span>
                  <fluid-sparkline
                    .values=${[12, 15, 10, 18, 22, 19, 25, 28, 26, 32, 30, 35]}
                    style="flex: 1 1 12rem; height: 2.5rem;"
                  ></fluid-sparkline>
                  <fluid-tag variant="success">+18%</fluid-tag>
                </div>
              </fluid-card>

              <div class="chart-board">
                <fluid-card class="chart-wide">
                  <h3 slot="header">Visitors</h3>
                  <fluid-line-chart
                    style="height: 15rem;"
                    .data=${{
                      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                      datasets: [
                        {
                          label: "Visitors",
                          data: [120, 142, 175, 168, 198, 220, 215],
                          fill: true,
                          tension: 0.3
                        }
                      ]
                    }}
                  ></fluid-line-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Revenue by month</h3>
                  <fluid-bar-chart
                    style="height: 15rem;"
                    .data=${{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                      datasets: [{ label: "Revenue", data: [12, 19, 15, 22, 28] }]
                    }}
                  ></fluid-bar-chart>
                </fluid-card>

                <fluid-card class="chart-wide">
                  <h3 slot="header">Wallet balances</h3>
                  <fluid-bar-chart
                    style="height: 16rem;"
                    .data=${{
                      labels: [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec"
                      ],
                      datasets: [
                        {
                          label: "Personal",
                          data: [4, 10, 15, 4, 16, 8, 12, 14, 17, 5, 12, 6]
                        },
                        {
                          label: "Corporate",
                          data: [2, 8, 3, 7, 3, 6, 7, 8, 5, 9, 8, 4]
                        },
                        {
                          label: "Investment",
                          data: [4, 5, 2, 8, 3, 4, 8, 8, 5, 9, 7, 4]
                        }
                      ]
                    }}
                    .options=${{ scales: { x: { stacked: true }, y: { stacked: true } } }}
                  ></fluid-bar-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Traffic sources</h3>
                  <fluid-doughnut-chart
                    style="height: 14rem;"
                    .data=${{
                      labels: ["Direct", "Search", "Referral", "Social"],
                      datasets: [{ data: [42, 31, 17, 10] }]
                    }}
                  ></fluid-doughnut-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Plan mix</h3>
                  <fluid-pie-chart
                    style="height: 14rem;"
                    .data=${{
                      labels: ["Starter", "Pro", "Team", "Enterprise"],
                      datasets: [{ data: [30, 25, 20, 25] }]
                    }}
                  ></fluid-pie-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Feature scores</h3>
                  <fluid-radar-chart
                    style="height: 14rem;"
                    .data=${{
                      labels: ["Speed", "Power", "Range", "Comfort", "Style"],
                      datasets: [{ label: "Model X", data: [85, 90, 70, 80, 75] }]
                    }}
                  ></fluid-radar-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Category spread</h3>
                  <fluid-polar-area-chart
                    style="height: 14rem;"
                    .data=${{
                      labels: ["Docs", "Guides", "API", "Blog"],
                      datasets: [{ data: [11, 16, 7, 14] }]
                    }}
                  ></fluid-polar-area-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Generic chart element</h3>
                  <p class="settings-note">
                    The typed elements are thin wrappers; fluid-chart takes the type as a property.
                  </p>
                  <fluid-chart
                    type="bar"
                    style="height: 12rem;"
                    .data=${{
                      labels: ["Q1", "Q2", "Q3", "Q4"],
                      datasets: [{ label: "Bookings", data: [18, 24, 21, 30] }]
                    }}
                  ></fluid-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Load vs. latency</h3>
                  <fluid-scatter-chart
                    style="height: 14rem;"
                    .data=${{
                      datasets: [
                        {
                          label: "Requests",
                          data: Array.from({ length: 25 }, (_, i) => ({
                            x: (i * 3.7) % 10,
                            y: ((i * 5.3) % 10) * 0.8 + 1
                          }))
                        }
                      ]
                    }}
                  ></fluid-scatter-chart>
                </fluid-card>

                <fluid-card>
                  <h3 slot="header">Accounts by size</h3>
                  <fluid-bubble-chart
                    style="height: 14rem;"
                    .data=${{
                      datasets: [
                        {
                          label: "Accounts",
                          data: Array.from({ length: 8 }, (_, i) => ({
                            x: (i * 2.3) % 10,
                            y: (i * 3.1) % 10,
                            r: 6 + ((i * 7) % 14)
                          }))
                        }
                      ]
                    }}
                  ></fluid-bubble-chart>
                </fluid-card>
              </div>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="marketing">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Marketing blocks</h3>
                <p>The pieces a landing or pricing page is built from.</p>
              </div>
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
              <fluid-card>
                <h3 slot="header">Hosting plans</h3>
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
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="editor">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Rich text editor</h3>
                <p>
                  A full editing surface: formatting toolbar, keyboard shortcuts, semantic output.
                </p>
              </div>
              <fluid-card>
                <fluid-rich-text-editor
                  label="Compose a note"
                  placeholder="Start typing..."
                  .value=${"<p>Fluid ships an <strong>accessible</strong> editor.</p>"}
                ></fluid-rich-text-editor>
              </fluid-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="nodegraph">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Node graph</h3>
                <p>
                  Typed ports and Bezier edges. Drag to connect, or build the same edge from the
                  keyboard.
                </p>
              </div>
              <fluid-card>
                <h3 slot="header">Pipeline graph</h3>
                <fluid-node-graph
                  style="height: 18rem"
                  label="Workflow preview"
                  .nodeTypes=${{
                    trigger: { label: "Trigger", input: false, removable: false },
                    task: {
                      label: "Task",
                      height: 116,
                      outputs: [
                        { id: "success", label: "On success", tone: "success" },
                        { id: "error", label: "On error", tone: "danger" }
                      ]
                    },
                    stop: { label: "Stop", outputs: [] }
                  }}
                  .nodes=${[
                    {
                      id: "p1",
                      type: "trigger",
                      x: 24,
                      y: 96,
                      label: "Every night",
                      summary: "Daily at 02:00"
                    },
                    {
                      id: "p2",
                      type: "task",
                      x: 304,
                      y: 40,
                      label: "Sync data",
                      summary: "Pull latest records"
                    },
                    { id: "p3", type: "stop", x: 584, y: 96, label: "Stop" }
                  ]}
                  .edges=${[
                    { id: "pe1", from: "p1", port: "next", to: "p2" },
                    { id: "pe2", from: "p2", port: "error", to: "p3" }
                  ]}
                ></fluid-node-graph>
              </fluid-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="maps">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Maps</h3>
                <p>
                  A themed Leaflet wrapper: tiles, markers and move events, styled by your tokens.
                </p>
              </div>
              <fluid-card>
                <h3 slot="header">Service regions</h3>
                <fluid-map
                  label="Map of central London"
                  style="--fluid-map-height: 16rem;"
                  .center=${[51.505, -0.09]}
                  .zoom=${13}
                  .markers=${[
                    { lat: 51.505, lng: -0.09, label: "Centre" },
                    { lat: 51.51, lng: -0.1, label: "North west" }
                  ]}
                ></fluid-map>
              </fluid-card>
            </div>
          </fluid-tab-panel>
          <fluid-tab-panel name="parser">
            <div class="scene scene-wide">
              <div class="scene-head">
                <h3>Import data</h3>
                <p>
                  Drop a file, parse it against a blueprint, then map its columns to your fields.
                </p>
              </div>
              <fluid-card>
                <h3 slot="header">1. Parse a file</h3>
                <fluid-file-parser
                  style="display:block;"
                  .blueprint=${{
                    fields: [
                      { key: "name", label: "Full name", type: "string", required: true },
                      { key: "email", type: "email", required: true, aliases: ["e-mail", "mail"] },
                      { key: "age", type: "integer", min: 0, max: 120 },
                      {
                        key: "role",
                        type: "enum",
                        options: ["engineer", "designer", "manager"],
                        default: "engineer"
                      }
                    ],
                    dedupeBy: "email"
                  }}
                ></fluid-file-parser>
              </fluid-card>
              <fluid-card>
                <h3 slot="header">2. Map the columns</h3>
                <fluid-column-mapper
                  .columns=${["order_id", "customer_name", "total_eur", "placed_at"]}
                  .blueprint=${{
                    fields: [
                      { key: "id", label: "Order ID", required: true },
                      { key: "customer", label: "Customer", required: true },
                      { key: "amount", label: "Amount" },
                      { key: "date", label: "Placed at" }
                    ]
                  }}
                  .mapping=${{
                    id: "order_id",
                    customer: "customer_name",
                    amount: null,
                    date: null
                  }}
                ></fluid-column-mapper>
              </fluid-card>
            </div>
          </fluid-tab-panel>
        </fluid-tabs>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "component-preview": ComponentPreview;
  }
}
