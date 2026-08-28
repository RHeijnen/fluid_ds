import "@fluid-ds/components/ssr-client";

declare global {
  interface Window {
    formFocusFixture: {
      ready: boolean;
      error: string | null;
      mode: string;
      tag: string;
      invalidEvents: number;
      dateChanges: {
        value: unknown;
        dateParts: number[] | null;
        dateTimestamp: number | null;
        timestamp: unknown;
        bubbles: boolean;
        composed: boolean;
      }[];
      submissions: { submitter: string | null; data: [string, FormDataEntryValue][] }[];
      initialShadowRoots: number;
      assertServerNodes(): void;
    };
  }
}

const definitions = {
  "fluid-input": () => import("@fluid-ds/components/define/input"),
  "fluid-checkbox": () => import("@fluid-ds/components/define/checkbox"),
  "fluid-switch": () => import("@fluid-ds/components/define/switch"),
  "fluid-textarea": () => import("@fluid-ds/components/define/textarea"),
  "fluid-number-input": () => import("@fluid-ds/components/define/number-input"),
  "fluid-typeahead": () => import("@fluid-ds/components/define/typeahead"),
  "fluid-masked-input": () => import("@fluid-ds/components/define/masked-input"),
  "fluid-select": () => import("@fluid-ds/components/define/select"),
  "fluid-time-picker": () => import("@fluid-ds/components/define/time-picker"),
  "fluid-date-picker": () => import("@fluid-ds/components/define/date-picker"),
  "fluid-color-picker": () => import("@fluid-ds/components/define/color-picker"),
  "fluid-file-input": () => import("@fluid-ds/components/define/file-input"),
  "fluid-otp": () => import("@fluid-ds/components/define/otp"),
  "fluid-radio-group": () => import("@fluid-ds/components/define/radio"),
  "fluid-date-range-picker": () => import("@fluid-ds/components/define/date-range-picker"),
  "fluid-scheduler": () => import("@fluid-ds/scheduler/define/scheduler")
};
type UpdatingHost = HTMLElement & { updateComplete: Promise<boolean>; isUpdatePending: boolean };
const form = document.querySelector<HTMLFormElement>("#native-form")!;
const field = document.querySelector<UpdatingHost>("#field")!;
const submit = document.querySelector<UpdatingHost>("#fluid-submit")!;
const tag = document.body.dataset.field!;
const mode = document.body.dataset.renderMode!;
const originalNodes = [field, submit].map((host) => ({
  host,
  root: host.shadowRoot,
  control: host.shadowRoot?.querySelector("input, textarea, button"),
  dropzone: host.shadowRoot?.querySelector(".dropzone") ?? null,
  fileControl: host.shadowRoot?.querySelector('input[type="file"]') ?? null,
  popup: host.shadowRoot?.querySelector('[part="listbox"]') ?? null,
  dialog: host.shadowRoot?.querySelector('[part="dialog"]') ?? null,
  calendar: host.shadowRoot?.querySelector<UpdatingHost>("fluid-calendar") ?? null,
  calendarRoot: host.shadowRoot?.querySelector("fluid-calendar")?.shadowRoot ?? null,
  calendars: [...(host.shadowRoot?.querySelectorAll<UpdatingHost>("fluid-calendar") ?? [])].map(
    (calendar) => ({ host: calendar, root: calendar.shadowRoot })
  ),
  hexHost: host.shadowRoot?.querySelector("fluid-input") ?? null,
  hexRoot: host.shadowRoot?.querySelector("fluid-input")?.shadowRoot ?? null,
  hexControl:
    host.shadowRoot?.querySelector("fluid-input")?.shadowRoot?.querySelector("input") ?? null,
  otpBoxes: [...(host.shadowRoot?.querySelectorAll<HTMLInputElement>(".box") ?? [])],
  radios: [...host.querySelectorAll<UpdatingHost>("fluid-radio")].map((radio) => ({
    host: radio,
    root: radio.shadowRoot,
    contents: [...(radio.shadowRoot?.childNodes ?? [])]
  })),
  options: [...host.querySelectorAll("fluid-option")].map((option) => ({
    host: option,
    root: option.shadowRoot,
    contents: [...(option.shadowRoot?.childNodes ?? [])]
  }))
}));

const fixture: Window["formFocusFixture"] = (window.formFocusFixture = {
  ready: false,
  error: null as string | null,
  mode,
  tag,
  invalidEvents: 0,
  dateChanges: [],
  submissions: [] as { submitter: string | null; data: [string, FormDataEntryValue][] }[],
  initialShadowRoots: originalNodes.filter(({ root }) => root !== null).length,
  assertServerNodes() {
    if (mode !== "dsd") return;
    for (const {
      host,
      root,
      control,
      dropzone,
      fileControl,
      popup,
      dialog,
      calendar,
      calendarRoot,
      calendars,
      hexHost,
      hexRoot,
      hexControl,
      otpBoxes,
      radios,
      options
    } of originalNodes) {
      const lightDomControl =
        (tag === "fluid-radio-group" || tag === "fluid-scheduler") && host === field;
      if (
        !root ||
        !host.isConnected ||
        host.shadowRoot !== root ||
        (!lightDomControl && (!control || !root.contains(control)))
      ) {
        throw new Error(`Native form hydration replaced a server control: ${host.id}`);
      }
      if (popup && !root.contains(popup))
        throw new Error(`Native form hydration replaced a server popup: ${host.id}`);
      if (
        tag === "fluid-file-input" &&
        host === field &&
        (!dropzone || !root.contains(dropzone) || !fileControl || !root.contains(fileControl))
      )
        throw new Error("Native form hydration replaced the visible or hidden server file picker");
      if (tag === "fluid-color-picker" && host === field) {
        if (
          !hexHost ||
          !root.contains(hexHost) ||
          !hexRoot ||
          hexHost.shadowRoot !== hexRoot ||
          !hexControl ||
          !hexRoot.contains(hexControl)
        )
          throw new Error("Native form hydration replaced the nested server hex input");
      }
      if (
        tag === "fluid-otp" &&
        host === field &&
        (otpBoxes.length !== 4 || otpBoxes.some((box) => !root.contains(box)))
      )
        throw new Error("Native form hydration replaced a server OTP box");
      if (tag === "fluid-radio-group" && host === field) {
        if (
          radios.length !== 3 ||
          radios.some(
            (radio) =>
              !host.contains(radio.host) ||
              !radio.root ||
              radio.host.shadowRoot !== radio.root ||
              radio.contents.some((node) => !radio.root!.contains(node))
          )
        )
          throw new Error("Native form hydration replaced a server radio option");
      }
      if (tag === "fluid-date-picker" && host === field) {
        if (
          !dialog ||
          !root.contains(dialog) ||
          !calendar ||
          !dialog.contains(calendar) ||
          !calendarRoot ||
          calendar.shadowRoot !== calendarRoot ||
          !calendar.isConnected
        )
          throw new Error("Native form hydration replaced a server date-picker dialog or calendar");
      }
      if (tag === "fluid-date-range-picker" && host === field) {
        if (
          !dialog ||
          !root.contains(dialog) ||
          calendars.length !== 2 ||
          calendars.some(
            (calendar) =>
              !dialog.contains(calendar.host) ||
              !calendar.root ||
              calendar.host.shadowRoot !== calendar.root ||
              !calendar.host.isConnected
          )
        )
          throw new Error(
            "Native form hydration replaced the server date-range dialog or a calendar"
          );
      }
      if (tag === "fluid-scheduler" && host === field) {
        if (
          calendars.length !== 1 ||
          calendars.some(
            (calendar) =>
              !root.contains(calendar.host) ||
              !calendar.root ||
              calendar.host.shadowRoot !== calendar.root ||
              !calendar.host.isConnected
          )
        )
          throw new Error("Native form hydration replaced the server scheduler calendar");
      }
      for (const option of options) {
        if (
          !option.root ||
          !host.contains(option.host) ||
          option.host.shadowRoot !== option.root ||
          option.contents.some((node) => !option.root!.contains(node))
        )
          throw new Error("Native form hydration replaced a server select option");
      }
    }
  }
});
field.addEventListener("invalid", () => {
  fixture.invalidEvents++;
});
field.addEventListener("fluid-change", (event) => {
  if (tag !== "fluid-date-picker" || event.target !== field) return;
  const detail = (event as CustomEvent<{ value: unknown; date: unknown; timestamp: unknown }>)
    .detail;
  const date = detail.date instanceof Date ? detail.date : null;
  fixture.dateChanges.push({
    value: detail.value,
    dateParts: date ? [date.getFullYear(), date.getMonth() + 1, date.getDate()] : null,
    dateTimestamp: date?.getTime() ?? null,
    timestamp: detail.timestamp,
    bubbles: event.bubbles,
    composed: event.composed
  });
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  fixture.submissions.push({
    submitter: (event as SubmitEvent).submitter?.id ?? null,
    data: [...new FormData(form)]
  });
});

async function start(): Promise<void> {
  if (!(tag in definitions) || !["client", "dsd"].includes(mode))
    throw new Error("Unknown native form fixture");
  if (fixture.initialShadowRoots !== (mode === "dsd" ? 2 : 0))
    throw new Error("Native form fixture render mode does not match its server markup");
  fixture.assertServerNodes();
  await Promise.all([
    definitions[tag as keyof typeof definitions](),
    import("@fluid-ds/components/define/button"),
    import("@fluid-ds/components/locales/nl")
  ]);
  for (let pass = 0; pass < 10; pass++) {
    const hosts = [field, submit];
    // A client-only parent must render before its nested calendar can exist.
    // DSD already contains that host, but both modes must await actual updates.
    const settled = await Promise.all(hosts.map((host) => host.updateComplete));
    if (tag === "fluid-color-picker") {
      const input = field.shadowRoot?.querySelector<UpdatingHost>("fluid-input");
      if (!input || !input.updateComplete) throw new Error("Color-picker input did not upgrade");
      hosts.push(input);
      settled.push(await input.updateComplete);
    }
    if (
      tag === "fluid-date-picker" ||
      tag === "fluid-date-range-picker" ||
      tag === "fluid-scheduler"
    ) {
      const calendars = [...(field.shadowRoot?.querySelectorAll<UpdatingHost>("fluid-calendar") ?? [])];
      const expected = tag === "fluid-date-range-picker" ? 2 : 1;
      if (calendars.length !== expected || calendars.some((calendar) => !calendar.updateComplete))
        throw new Error(`${tag} calendars did not upgrade`);
      hosts.push(...calendars);
      settled.push(...(await Promise.all(calendars.map((calendar) => calendar.updateComplete))));
    }
    if (settled.every(Boolean) && hosts.every((host) => !host.isUpdatePending)) {
      fixture.assertServerNodes();
      fixture.ready = true;
      return;
    }
  }
  throw new Error(`Native form updates did not settle: ${tag}`);
}
void start().catch((error: unknown) => {
  fixture.error = String(error);
  console.error(error);
});
