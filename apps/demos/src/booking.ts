/**
 * Booking demo: the @fluid-ds/scheduler appointment picker running on a
 * clinic's real weekly opening hours. Pick a day, pick a free 20-minute
 * slot, and the confirmation card mirrors the selection live via the
 * scheduler's `fluid-change` event.
 */
import "./shared/register-fluid.js";
import "@fluid-ds/scheduler/define/scheduler";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Booking", currentRoute: "booking" });
mountDesignOverlay();

/** Open Mon-Fri with a lunch break, Saturday mornings, closed Sunday. */
const clinicHours = {
  weekly: {
    1: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" }
    ],
    2: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" }
    ],
    3: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" }
    ],
    4: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" }
    ],
    5: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "16:00" }
    ],
    6: [{ start: "09:00", end: "12:00" }]
  },
  slotMinutes: 20,
  minNoticeMinutes: 120,
  maxAdvanceDays: 45
};

main.innerHTML = `
  <section class="demo-page fluid-glass-panel">
    <header class="demo-page-head">
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
        <fluid-breadcrumb-item current>Booking</fluid-breadcrumb-item>
      </fluid-breadcrumb>
      <h1>Book a check-up</h1>
      <p class="muted-lead">
        One <code>&lt;fluid-scheduler&gt;</code> with the clinic's weekly hours: it derives the
        bookable days and free slots itself, honors minimum notice, and books out 45 days ahead.
      </p>
    </header>

    <div class="demo-two-col">
      <fluid-card>
        <h3 slot="header">Pick a time</h3>
        <fluid-scheduler id="scheduler" time-format="24h"></fluid-scheduler>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Your appointment</h3>
        <div id="booking-summary">
          <p class="muted-lead" id="booking-empty">Nothing selected yet. Pick a day and a slot.</p>
          <dl class="booking-lines" id="booking-lines" hidden>
            <div><dt>Date</dt><dd id="booking-date">-</dd></div>
            <div><dt>Time</dt><dd id="booking-time">-</dd></div>
            <div><dt>Practice</dt><dd>Fluid Family Health</dd></div>
            <div><dt>Duration</dt><dd>20 minutes</dd></div>
          </dl>
        </div>
        <div slot="footer" class="dialog-actions">
          <fluid-button id="booking-confirm" disabled>Confirm booking</fluid-button>
        </div>
      </fluid-card>
    </div>
  </section>
`;

const scheduler = document.getElementById("scheduler") as HTMLElement & {
  availability?: unknown;
};
scheduler.availability = clinicHours;

const emptyNote = document.getElementById("booking-empty")!;
const lines = document.getElementById("booking-lines")!;
const confirmButton = document.getElementById("booking-confirm") as HTMLElement & {
  disabled?: boolean;
};

scheduler.addEventListener("fluid-change", (event) => {
  // detail: { value, start, end }, local ISO strings like "2026-09-01T09:20".
  const detail = (event as CustomEvent).detail as { start?: string; end?: string };
  const [date = "", startTime = ""] = (detail?.start ?? "").split("T");
  const endTime = (detail?.end ?? "").split("T")[1] ?? "";
  const chosen = Boolean(date && startTime);
  emptyNote.hidden = chosen;
  lines.hidden = !chosen;
  confirmButton.disabled = !chosen;
  document.getElementById("booking-date")!.textContent = date || "-";
  document.getElementById("booking-time")!.textContent = chosen
    ? `${startTime} to ${endTime}`
    : "-";
});
