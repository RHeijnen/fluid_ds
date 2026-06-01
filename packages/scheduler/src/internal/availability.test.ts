import { expect } from "@open-wc/testing";
import {
  parseTime,
  minutesToTime,
  toISODate,
  fromISODate,
  toLocalISO,
  fromLocalISO,
  windowsForDate,
  generateSlots,
  dayState,
  type Availability,
  type Weekday
} from "./availability.js";

// 2026-06-15 is the anchor test day; key weekly rules off its real weekday so
// the tests don't hard-code a day-of-week assumption.
const DAY = "2026-06-15";
const WD = new Date(2026, 5, 15).getDay() as Weekday;

function avail(overrides: Partial<Availability> = {}): Availability {
  return {
    weekly: { [WD]: [{ start: "09:00", end: "12:00" }] },
    slotMinutes: 30,
    ...overrides
  };
}

describe("availability engine", () => {
  describe("time helpers", () => {
    it("parses HH:MM to minutes", () => {
      expect(parseTime("09:00")).to.equal(540);
      expect(parseTime("13:45")).to.equal(825);
      expect(parseTime("00:00")).to.equal(0);
    });

    it("rejects malformed or out-of-range times", () => {
      expect(parseTime("9am")).to.be.null;
      expect(parseTime("24:00")).to.be.null;
      expect(parseTime("10:60")).to.be.null;
    });

    it("round-trips minutes to HH:MM", () => {
      expect(minutesToTime(540)).to.equal("09:00");
      expect(minutesToTime(825)).to.equal("13:45");
    });

    it("serializes local dates and datetimes without UTC drift", () => {
      const d = new Date(2026, 5, 15, 9, 30);
      expect(toISODate(d)).to.equal("2026-06-15");
      expect(toLocalISO(d)).to.equal("2026-06-15T09:30");
    });

    it("parses ISO dates and datetimes back to local", () => {
      expect(fromISODate("2026-06-15")?.getDate()).to.equal(15);
      expect(fromISODate("2026-02-31")).to.be.null; // overflow rejected
      const dt = fromLocalISO("2026-06-15T09:30");
      expect(dt?.getHours()).to.equal(9);
      expect(dt?.getMinutes()).to.equal(30);
    });
  });

  describe("windowsForDate", () => {
    it("returns the weekly windows for the day", () => {
      expect(windowsForDate(DAY, avail())).to.deep.equal([{ start: "09:00", end: "12:00" }]);
    });

    it("returns [] for a weekday with no rule", () => {
      const otherDay = WD === 0 ? "2026-06-16" : "2026-06-21"; // a different weekday
      expect(windowsForDate(otherDay, avail())).to.deep.equal([]);
    });

    it("lets a closed exception override the weekly rule", () => {
      const a = avail({ exceptions: [{ date: DAY, closed: true }] });
      expect(windowsForDate(DAY, a)).to.deep.equal([]);
    });

    it("lets an exception replace the windows", () => {
      const a = avail({ exceptions: [{ date: DAY, windows: [{ start: "14:00", end: "16:00" }] }] });
      expect(windowsForDate(DAY, a)).to.deep.equal([{ start: "14:00", end: "16:00" }]);
    });
  });

  describe("generateSlots", () => {
    const past = new Date(2026, 5, 15, 0, 0); // midnight: nothing is in the past yet

    it("slices a window by step and slot length", () => {
      const slots = generateSlots(DAY, avail(), [], past);
      // 09:00–12:00 in 30-min slots = 6
      expect(slots).to.have.length(6);
      expect(slots[0].start).to.equal("2026-06-15T09:00");
      expect(slots[0].end).to.equal("2026-06-15T09:30");
      expect(slots[5].start).to.equal("2026-06-15T11:30");
      expect(slots.every((s) => s.state === "available")).to.be.true;
    });

    it("honors a custom step independent of slot length", () => {
      const slots = generateSlots(DAY, avail({ slotMinutes: 30, stepMinutes: 60 }), [], past);
      // starts every 60 min, each 30 long: 09:00, 10:00, 11:00 = 3
      expect(slots.map((s) => s.start)).to.deep.equal([
        "2026-06-15T09:00",
        "2026-06-15T10:00",
        "2026-06-15T11:00"
      ]);
    });

    it("marks slots before now + min-notice as past", () => {
      const now = new Date(2026, 5, 15, 8, 0);
      const slots = generateSlots(DAY, avail({ minNoticeMinutes: 120 }), [], now);
      // cutoff = 10:00 → 09:00 and 09:30 are past
      expect(slots.find((s) => s.start === "2026-06-15T09:00")!.state).to.equal("past");
      expect(slots.find((s) => s.start === "2026-06-15T09:30")!.state).to.equal("past");
      expect(slots.find((s) => s.start === "2026-06-15T10:00")!.state).to.equal("available");
    });

    it("marks slots beyond max-advance as blocked", () => {
      const now = new Date(2026, 5, 15, 0, 0);
      const target = "2026-06-22"; // same weekday, 7 days out
      const a = avail({ maxAdvanceDays: 3 });
      const slots = generateSlots(target, a, [], now);
      expect(slots.length).to.be.greaterThan(0);
      expect(slots.every((s) => s.state === "blocked")).to.be.true;
    });

    it("marks a slot full when capacity is exhausted by bookings", () => {
      const slots = generateSlots(DAY, avail(), [{ start: "2026-06-15T09:00" }], past);
      const nine = slots.find((s) => s.start === "2026-06-15T09:00")!;
      expect(nine.state).to.equal("full");
      expect(nine.remaining).to.equal(0);
      expect(slots.find((s) => s.start === "2026-06-15T09:30")!.state).to.equal("available");
    });

    it("keeps group slots available until capacity runs out", () => {
      const a = avail({ capacity: 3 });
      const slots = generateSlots(DAY, a, [{ start: "2026-06-15T09:00" }, { start: "2026-06-15T09:00" }], past);
      const nine = slots.find((s) => s.start === "2026-06-15T09:00")!;
      expect(nine.remaining).to.equal(1);
      expect(nine.state).to.equal("available");
    });

    it("applies a buffer after a booking to neighbouring slots", () => {
      const a = avail({ bufferMinutes: 30 });
      const slots = generateSlots(DAY, a, [{ start: "2026-06-15T09:00", end: "2026-06-15T09:30" }], past);
      // 09:00 booked; 30-min buffer pushes the block to 10:00, so 09:30 is full, 10:00 free
      expect(slots.find((s) => s.start === "2026-06-15T09:30")!.state).to.equal("full");
      expect(slots.find((s) => s.start === "2026-06-15T10:00")!.state).to.equal("available");
    });

    it("sorts slots from out-of-order windows chronologically", () => {
      const a = avail({ weekly: { [WD]: [{ start: "13:00", end: "14:00" }, { start: "09:00", end: "10:00" }] } });
      const slots = generateSlots(DAY, a, [], past);
      expect(slots[0].start).to.equal("2026-06-15T09:00");
      expect(slots[slots.length - 1].start).to.equal("2026-06-15T13:30");
    });
  });

  describe("dayState", () => {
    const past = new Date(2026, 5, 15, 0, 0);

    it("is closed when the business has no hours", () => {
      const otherDay = WD === 0 ? "2026-06-16" : "2026-06-21";
      expect(dayState(otherDay, avail(), [], past)).to.equal("closed");
    });

    it("is open when every slot is bookable", () => {
      expect(dayState(DAY, avail(), [], past)).to.equal("open");
    });

    it("is some when only part of the day is bookable", () => {
      expect(dayState(DAY, avail(), [{ start: "2026-06-15T09:00" }], past)).to.equal("some");
    });

    it("is full when every slot is booked out", () => {
      const bookings = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"
      ].map((t) => ({ start: `2026-06-15T${t}` }));
      expect(dayState(DAY, avail(), bookings, past)).to.equal("full");
    });

    it("is unavailable when the whole day is already past", () => {
      const now = new Date(2026, 5, 15, 23, 0);
      expect(dayState(DAY, avail(), [], now)).to.equal("unavailable");
    });
  });
});
