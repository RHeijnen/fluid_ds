import type { ReactiveController, ReactiveControllerHost } from "lit";

export type FluidBinaryUnit =
  | "bit"
  | "kibibit"
  | "mebibit"
  | "gibibit"
  | "tebibit"
  | "byte"
  | "kibibyte"
  | "mebibyte"
  | "gibibyte"
  | "tebibyte";

const englishBinaryUnits: Record<FluidBinaryUnit, readonly [string, string]> = {
  bit: ["bit", "bits"],
  kibibit: ["kibibit", "kibibits"],
  mebibit: ["mebibit", "mebibits"],
  gibibit: ["gibibit", "gibibits"],
  tebibit: ["tebibit", "tebibits"],
  byte: ["byte", "bytes"],
  kibibyte: ["kibibyte", "kibibytes"],
  mebibyte: ["mebibyte", "mebibytes"],
  gibibyte: ["gibibyte", "gibibytes"],
  tebibyte: ["tebibyte", "tebibytes"]
};

export const english = {
  $code: "en",
  countdownComplete: "Countdown complete.",
  /** Duration is a localized display string, not a number of seconds. */
  countdownRemaining: (duration: string) => `${duration} remaining.`,
  /** Current and total are localized display strings; callbacks own sentence order. */
  tourStep: (current: string, total: string) => `Step ${current} of ${total}`,
  /** Counts are display strings; title and body remain application-owned plain text. */
  tourStepAnnouncement: (current: string, total: string, title: string, body: string) =>
    `Step ${current} of ${total}. ${title}. ${body}`,
  skip: "Skip",
  back: "Back",
  next: "Next",
  done: "Done",
  meter: "Meter",
  meterValue: (value: string, maximum: string) => `${value} of ${maximum}`,
  meterValueWithBand: (
    value: string,
    maximum: string,
    band: "optimum" | "suboptimum" | "even-less-good"
  ) =>
    `${value} of ${maximum}, ${band === "optimum" ? "good" : band === "suboptimum" ? "fair" : "poor"}`,
  binaryUnit: (
    pluralCategory: Intl.LDMLPluralRule,
    formattedValue: string,
    unit: FluidBinaryUnit
  ) => {
    const names = englishBinaryUnits[unit];
    return `${formattedValue} ${names[pluralCategory === "one" ? 0 : 1]}`;
  },
  notifications: "Notifications",
  $dir: "ltr" as const,
  apply: "Apply",
  avatar: "Avatar",
  avatarWithInitials: (initials: string) => `Avatar: ${initials}`,
  breadcrumb: "Breadcrumb",
  cancel: "Cancel",
  chooseDate: "Choose date",
  chooseDateRange: "Choose date range",
  chooseTime: "Choose time",
  chooseOrDropFiles: "Click or drag files here",
  closeDialog: "Close dialog",
  closeDrawer: "Close drawer",
  color: "Color",
  colorPresets: "Color presets",
  commandPalette: "Command palette",
  commandPlaceholder: "Type a command or search…",
  comparisonSlider: "Comparison slider",
  contextMenu: "Context menu",
  copied: "Copied",
  copyToClipboard: "Copy to clipboard",
  decrease: "Decrease",
  days: "days",
  dismiss: "Dismiss",
  invalidHexColor: "Enter a valid hex color (e.g. #ff00aa).",
  chooseColorRequired: "Please choose a color.",
  completeField: "Please complete the field.",
  selectFileRequired: "Please select a file.",
  chooseDateRequired: "Please choose a date.",
  chooseDateRangeRequired: "Please choose a date range.",
  chooseTimeRequired: "Please choose a time.",
  chooseAppointmentRequired: "Please choose an appointment.",
  appointmentUnavailable: "The selected appointment is not available.",
  multipleFilesHint: "Multiple files supported",
  singleFileHint: "One file at a time",
  onThisPage: "On this page",
  openMenu: "Open menu",
  alert: "Alert",
  notification: "Notification",
  copyCode: "Copy code",
  areYouSure: "Are you sure?",
  confirm: "Confirm",
  minimum: "Minimum",
  maximum: "Maximum",
  actions: "Actions",
  resizePanels: "Resize panels",
  remove: "Remove",
  available: "Available",
  selected: "Selected",
  pricingPlans: "Pricing plans",
  mostPopular: "Most popular",
  clear: "Clear",
  undo: "Undo",
  upload: "Upload",
  fit: "Fit",
  copyLanguageCode: (language: string) => `Copy ${language} code`,
  dropFilesOrBrowse: "Drag files here or click to browse",
  fileInput: "File input",
  fillOutField: "Please fill out this field.",
  checkThisBox: "Please check this box.",
  toggleThisSwitch: "Please toggle this switch.",
  pickAnOption: "Please pick an option.",
  completeCode: "Please complete the code.",
  showMore: "Show more",
  showLess: "Show less",
  hoursShort: "hrs",
  increase: "Increase",
  loading: "Loading",
  menu: "Menu",
  minutesShort: "min",
  navigation: "Navigation",
  noMatches: "No matches",
  noMatchingTimes: "No matching times",
  selectDayAvailableTimes: "Select a day to see available times.",
  loadingAvailability: "Loading availability",
  timeSlots: "Time slots",
  timeSlotsFor: (date: string) => `Time slots for ${date}`,
  noOpeningsOnDay: "No openings on this day.",
  selectDayToSeeOpenings: "Select a day to see openings.",
  slotUnavailable: (label: string) => `${label}, unavailable`,
  openingsAvailable: (count: number, date: string) =>
    `${count} ${count === 1 ? "opening" : "openings"} available${date ? ` on ${date}` : ""}.`,
  nextMonth: "Next month",
  nextPage: "Next page",
  nextSlide: "Next slide",
  noResults: "No results found.",
  oneTimeCode: "One-time code",
  pagination: "Pagination",
  popover: "Popover",
  page: (page: number) => `Page ${page}`,
  previousMonth: "Previous month",
  previousPage: "Previous page",
  previousSlide: "Previous slide",
  progress: "Progress",
  rangePresets: "Range presets",
  selectRange: "Select a range",
  presetToday: "Today",
  presetYesterday: "Yesterday",
  presetLast7Days: "Last 7 days",
  presetLast30Days: "Last 30 days",
  presetThisMonth: "This month",
  presetLastMonth: "Last month",
  rating: "Rating",
  required: "required",
  showPassword: "Show password",
  hidePassword: "Hide password",
  secondsShort: "sec",
  select: "Select…",
  selectDate: "Select a date",
  selectDateRange: "Select a date range",
  selectTime: "Select a time",
  signHere: "Sign here",
  signature: "Signature",
  sidebar: "Sidebar",
  slideOf: (slide: number, total: number) => `Slide ${slide} of ${total}`,
  slides: "Slides",
  timeOptions: "Time options",
  timeRemaining: "Time remaining",
  toggleDarkMode: "Toggle dark mode",
  cycleBrand: "Cycle brand",
  cycleBrandCurrent: (brand: string) => `Cycle brand, current ${brand}`,
  digitOf: (digit: number, length: number) => `Digit ${digit} of ${length}`,
  goToSlide: (slide: number) => `Go to slide ${slide}`,
  hexColor: (label: string) => `${label} hex`,
  openColorPicker: (label: string) => `${label}, open picker`,
  moveSelectedTo: (label: string) => `Move selected to ${label}`,
  removeFile: (name: string) => `Remove ${name}`,
  playAnimation: "Play animation",
  pauseAnimation: "Pause animation",
  audioPlayer: "Audio player",
  playMedia: "Play",
  pauseMedia: "Pause",
  seekMedia: "Seek",
  playbackPosition: (current: string, total: string) => `${current} of ${total}`,
  muteMedia: "Mute",
  unmuteMedia: "Unmute",
  video: "Video",
  playlist: "Playlist",
  trackNumber: (number: string) => `Track ${number}`,
  imagePosition: (current: string, total: string) => `Image ${current} of ${total}`,
  imageViewer: "Image viewer",
  previousImage: "Previous image",
  nextImage: "Next image",
  closeViewer: "Close",
  positionOf: (current: string, total: string) => `${current} of ${total}`,
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetZoom: "Reset zoom",
  panLeft: "Pan left",
  panRight: "Pan right",
  panUp: "Pan up",
  panDown: "Pan down",
  eventsOnDate: (count: number, formattedCount: string, date: string) =>
    `${date}, ${formattedCount} ${count === 1 ? "event" : "events"}`,
  showAllEvents: (count: number, formattedCount: string, date: string) =>
    `Show all ${formattedCount} ${count === 1 ? "event" : "events"} on ${date}`,
  moreEvents: (count: number, formattedCount: string) =>
    `+${formattedCount} more ${count === 1 ? "event" : "events"}`,
  slotRules: "Slot rules",
  slotLengthMinutes: "Slot length (minutes)",
  capacityPerSlot: "Capacity per slot",
  minimumNoticeHours: "Minimum notice (hours)",
  bookUpToDays: "Book up to (days)",
  weeklyHours: "Weekly hours",
  openOnDay: (day: string) => `Open on ${day}`,
  openingTime: (day: string, position: string) => `${day} opening time ${position}`,
  closingTime: (day: string, position: string) => `${day} closing time ${position}`,
  removeTimeWindow: (day: string, position: string) => `Remove ${day} window ${position}`,
  openingBeforeClosing: "Opening time must be before closing time.",
  addHours: "Add hours",
  closed: "Closed",
  closedDates: "Closed dates",
  closedDate: "Closed date",
  closedAllDay: "Closed all day",
  removeClosedDate: "Remove closed date",
  addClosedDate: "Add closed date",
  richTextEditor: "Rich text editor",
  editorFormatting: "Formatting",
  editorBold: "Bold",
  editorItalic: "Italic",
  editorUnderline: "Underline",
  editorBulletList: "Bullet list",
  editorNumberedList: "Numbered list",
  editorLink: "Link",
  editorClearFormatting: "Clear formatting",
  editorLinkUrl: "Link URL",
  kanbanMoveUp: "Move up",
  kanbanMoveDown: "Move down",
  kanbanMovePreviousColumn: "Move to previous column",
  kanbanMoveNextColumn: "Move to next column",
  kanbanMoveAction: (action: string, card: string) => `${action}: ${card}`,
  kanbanMovedCard: (card: string, column: string, position: string, total: string) =>
    `Moved ${card} to ${column}, position ${position} of ${total}.`,
  kanbanDroppedIn: (column: string) => `Dropped in ${column}.`,
  kanbanDropped: "Dropped.",
  kanbanPickedUpIn: (column: string) =>
    `Picked up. Use arrow keys to move, Space to drop, Escape to cancel. In ${column}.`,
  kanbanPickedUp: "Picked up.",
  kanbanMoveCancelled: "Move cancelled.",
  kanbanDraggableCard: "Draggable card",
  kanbanBoard: "Kanban board",
  nodeGraph: "Node graph",
  nodeGraphEditorRole: "node graph editor",
  nodeGraphNodeMoved: (node: string, x: string, y: string) => `${node} moved to ${x}, ${y}`,
  nodeGraphNodeRemoved: (node: string) => `${node} removed`,
  nodeGraphNodeSelected: (node: string) => `${node} selected`,
  nodeGraphEdgeSelected: (from: string, to: string) =>
    `Connection from ${from} to ${to} selected. Press Delete to remove it.`,
  nodeGraphEdgeRemoved: (from: string, to: string) => `Connection from ${from} to ${to} removed`,
  nodeGraphConnectStart: (node: string, port: string) =>
    `Connecting from ${node}, ${port}. Use arrow keys to choose a target, Enter to connect, Escape to cancel.`,
  nodeGraphConnectCandidate: (node: string, index: string, count: string) =>
    `${node}, ${index} of ${count}`,
  nodeGraphConnected: (from: string, to: string) => `Connected ${from} to ${to}`,
  nodeGraphConnectCancelled: "Connection cancelled",
  nodeGraphConnectFailed: "Could not connect",
  nodeGraphConnectNoTargets: "No available targets to connect to",
  nodeGraphZoomChanged: (percent: string) => `Zoom ${percent} percent`,
  nodeGraphInputPort: (node: string) => `Input of ${node}`,
  nodeGraphOutputPort: (port: string, node: string) => `${port}, output of ${node}`,
  nodeGraphNodeRole: "node",
  nodeGraphNodeCount: (count: number, formattedCount: string) =>
    `${formattedCount} ${count === 1 ? "node" : "nodes"}`,
  nodeGraphEdgeCount: (count: number, formattedCount: string) =>
    `${formattedCount} ${count === 1 ? "edge" : "edges"}`,
  chart: "Chart",
  chartTotal: "Total",
  chartLegendItem: (chart: string, position: string) => `${chart} ${position}`,
  map: "Map",
  markdownLoadFailed: (detail: string) => `Failed to load markdown: ${detail}`,
  qrCodeFor: (value: string) => `QR code for ${value}`,
  emptyQrCode: "Empty QR code",
  parserRequiredTitle: "Required",
  parserSelectColumn: "Select a column…",
  parserNotMapped: "(not mapped)",
  parserDropFile: "Drop a CSV, JSON, or Excel file here, or click to browse",
  parserInvalidJsonSyntax: (reason: string) => `Invalid JSON: ${reason}`,
  parserInvalidJsonShape: "JSON must be an array of objects or an object with a rows/data array.",
  parserCouldNotParseFile: "Could not parse the file.",
  parserCouldNotReadFile: (filename: string) =>
    filename ? `Could not read ${filename}` : "Could not read the file",
  parserFieldRequired: (label: string) => `${label} is required`,
  parserStringTooShort: (label: string, minimum: string) =>
    `${label} must be at least ${minimum} characters`,
  parserStringTooLong: (label: string, maximum: string) =>
    `${label} must be at most ${maximum} characters`,
  parserPatternMismatch: (label: string) => `${label} does not match the required format`,
  parserInvalidNumber: (label: string, value: string) => `${label} is not a number: "${value}"`,
  parserInvalidInteger: (label: string, value: string) =>
    `${label} must be a whole number: "${value}"`,
  parserNumberBelowMinimum: (label: string, minimum: string) => `${label} must be ≥ ${minimum}`,
  parserNumberAboveMaximum: (label: string, maximum: string) => `${label} must be ≤ ${maximum}`,
  parserInvalidBoolean: (label: string, value: string) =>
    `${label} is not a recognized boolean: "${value}"`,
  parserInvalidDate: (label: string, value: string) => `${label} is not a valid date: "${value}"`,
  parserDateBeforeMinimum: (label: string) => `${label} is before the allowed range`,
  parserDateAfterMaximum: (label: string) => `${label} is after the allowed range`,
  parserInvalidEmail: (label: string, value: string) => `${label} is not a valid email: "${value}"`,
  parserInvalidUrl: (label: string, value: string) => `${label} is not a valid URL: "${value}"`,
  parserInvalidEnum: (label: string, options: string) => `${label} must be one of: ${options}`,
  parserInvalidJson: (label: string) => `${label} is not valid JSON`,
  parserUnmappedRequired: (label: string) => `${label} is required but not mapped`,
  parserTransformFailed: (label: string, reason: string) => `${label} transform failed: ${reason}`,
  parserReadySummary: (
    _kept: number,
    total: number,
    duplicates: number,
    truncated: number,
    keptDisplay: string,
    totalDisplay: string,
    duplicatesDisplay: string,
    truncatedDisplay: string
  ) => {
    const parts = [`${keptDisplay} of ${totalDisplay} ${total === 1 ? "row" : "rows"} ready`];
    if (duplicates > 0)
      parts.push(`${duplicatesDisplay} ${duplicates === 1 ? "duplicate" : "duplicates"} removed`);
    if (truncated > 0) parts.push(`${truncatedDisplay} over the row cap`);
    return parts.join(", ");
  },
  parserCellErrorsFound: (count: number, formattedCount: string) =>
    `${formattedCount} cell ${count === 1 ? "error" : "errors"} found`,
  parserAllRowsValid: "All rows valid",
  parserPreviewCaption: (
    shown: number,
    shownDisplay: string,
    total: number,
    totalDisplay: string
  ) =>
    `Preview of ${shownDisplay}${total > shown ? ` of ${totalDisplay}` : ""} cleaned ${shown === 1 ? "row" : "rows"}. Highlighted cells failed validation.`,
  parserMapColumns: "Map columns",
  parserPreview: "Preview",
  parserImportRows: (count: number, formattedCount: string) =>
    `Import ${formattedCount} ${count === 1 ? "row" : "rows"}`,
  parserDownloadFormat: (format: string) => `Download ${format}`,
  parserReset: "Reset",
  selectAllRows: "Select all rows",
  selectTableRow: (position: string) => `Select row ${position}`,
  tableResizeColumn: (column: string) => `Resize ${column}`,
  tableReorderColumn: (column: string) => `Reorder ${column}`,
  tableColumnPosition: (column: string, position: string, count: string) =>
    `${column}, column ${position} of ${count}`,
  tableColumns: "Table columns",
  closeColumnSettings: "Close column settings",
  moveColumnEarlier: (column: string) => `Move ${column} earlier`,
  moveColumnLater: (column: string) => `Move ${column} later`,
  columns: "Columns",
  tableResults: (count: number, formattedCount: string) =>
    `${formattedCount} ${count === 1 ? "result" : "results"}`,
  tableLoadedResults: (count: number, formattedCount: string) =>
    `${formattedCount} ${count === 1 ? "result loaded" : "results loaded"}`,
  tableLoadedOf: (_loadedCount: number, loaded: string, total: string) =>
    `${loaded} loaded of ${total}`,
  tableLoadedMatchingTotal: (_loadedCount: number, loaded: string, available: string) =>
    `${loaded} loaded matching · ${available} total`,
  tableLoadedOfMatchingTotal: (
    _loadedCount: number,
    loaded: string,
    total: string,
    available: string
  ) => `${loaded} loaded of ${total} matching · ${available} total`,
  tableNoResults: "No results",
  loadingMoreResults: "Loading more results",
  scrollToLoadMore: "Scroll to load more",
  allResultsLoaded: "All results loaded"
};

type FluidTranslationTerms = Omit<typeof english, "$code" | "$dir">;
export type FluidTranslationTerm = Exclude<keyof typeof english, "$code" | "$dir">;
/** Parameters follow the selected message; plain strings accept no arguments. */
export type FluidTranslationArguments<K extends FluidTranslationTerm> =
  FluidTranslationTerms[K] extends (...args: infer Args) => string ? Args : [];
export type FluidTranslationDictionary = FluidTranslationTerms & {
  $code: string;
  $dir: "ltr" | "rtl";
};
export type FluidTranslation = Partial<FluidTranslationTerms> & {
  $code: string;
  $dir?: "ltr" | "rtl";
};

/** Build a complete diagnostic locale while preserving parameterized term signatures. */
export function createPseudoTranslation(
  code: string,
  dir: "ltr" | "rtl",
  transform: (value: string) => string
): FluidTranslationDictionary {
  const dictionary: Record<string, unknown> = { $code: code, $dir: dir };
  for (const [key, value] of Object.entries(english)) {
    if (key === "$code" || key === "$dir") continue;
    dictionary[key] =
      typeof value === "function"
        ? pseudoFunction(value as (...items: never[]) => string, transform)
        : transform(value);
  }
  return dictionary as FluidTranslationDictionary;
}

/** Preserve callback arity so pseudo dictionaries exercise the same runtime contract as English. */
function pseudoFunction(
  value: (...items: never[]) => string,
  transform: (value: string) => string
): (...items: never[]) => string {
  const call = (...args: unknown[]) => {
    // Invoke the source formatter with its real arguments first. Some message
    // callbacks use string arguments as discriminants (for example binary
    // units), so replacing arguments before invocation can break their logic.
    // Mask consumer-owned strings in the formatted result instead, longest
    // first so overlapping values remain intact through the pseudo transform.
    let source = value(...(args as never[]));
    const strings = [
      ...new Set(args.filter((argument): argument is string => typeof argument === "string"))
    ]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((argument, index) => [`\uE000${index}\uE001`, argument] as const);
    for (const [marker, argument] of strings) source = source.replaceAll(argument, marker);
    let output = transform(source);
    for (const [marker, argument] of strings) output = output.replaceAll(marker, argument);
    return output;
  };
  switch (value.length) {
    case 0:
      return () => call();
    case 1:
      return (a) => call(a);
    case 2:
      return (a, b) => call(a, b);
    case 3:
      return (a, b, c) => call(a, b, c);
    case 4:
      return (a, b, c, d) => call(a, b, c, d);
    case 5:
      return (a, b, c, d, e) => call(a, b, c, d, e);
    case 6:
      return (a, b, c, d, e, f) => call(a, b, c, d, e, f);
    case 7:
      return (a, b, c, d, e, f, g) => call(a, b, c, d, e, f, g);
    case 8:
      return (a, b, c, d, e, f, g, h) => call(a, b, c, d, e, f, g, h);
    default:
      throw new RangeError(`Unsupported localization callback arity: ${value.length}`);
  }
}

const translations = new Map<string, FluidTranslation>([["en", english]]);
const serverContexts = new WeakMap<HTMLElement, { lang?: string; dir?: string }>();
const hosts = new Set<ReactiveControllerHost>();
const contextObservers = new Map<
  Node,
  {
    observer: MutationObserver;
    hosts: Set<ReactiveControllerHost>;
  }
>();

function normalize(code: string): string {
  return code.trim().toLowerCase();
}

function notify(): void {
  for (const host of hosts) host.requestUpdate();
}

/** Follow HTML language inheritance, including shadow hosts but not assigned slots. */
function contextParent(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const parent = element.parentNode;
  return parent && "host" in parent ? (parent as ShadowRoot).host : null;
}

function contextAttribute(element: Element, name: "lang" | "dir"): string | null {
  for (let current: Element | null = element; current; current = contextParent(current)) {
    const value = current.getAttribute?.(name);
    if (value != null) return value;
  }
  const serverValue = serverContexts.get(element as HTMLElement)?.[name];
  if (serverValue != null) return serverValue;
  return null;
}

/** @internal Bind parser-derived native ancestry to one request-local SSR element. */
export function setServerLocalizationContext(
  element: HTMLElement,
  context: { lang?: string; dir?: string }
): void {
  serverContexts.set(element, context);
}

function observeContext(host: ReactiveControllerHost & HTMLElement): Set<Node> {
  const roots = new Set<Node>();
  const Observer =
    host.ownerDocument?.defaultView?.MutationObserver ??
    (typeof MutationObserver === "undefined" ? undefined : MutationObserver);
  if (!Observer) return roots;
  for (let current: Element | null = host; current; current = contextParent(current)) {
    const root = current.getRootNode?.();
    if (
      !root ||
      roots.has(root) ||
      (root.nodeType !== 9 && !(root.nodeType === 11 && "host" in root))
    )
      continue;
    roots.add(root);
    let entry = contextObservers.get(root);
    if (!entry) {
      const subscribers = new Set<ReactiveControllerHost>();
      const observer = new Observer(() => {
        for (const subscriber of subscribers) subscriber.requestUpdate();
      });
      observer.observe(root, { attributes: true, attributeFilter: ["lang", "dir"], subtree: true });
      entry = { observer, hosts: subscribers };
      contextObservers.set(root, entry);
    }
    entry.hosts.add(host);
  }
  return roots;
}

function releaseContext(host: ReactiveControllerHost, roots: Set<Node>): void {
  for (const root of roots) {
    const entry = contextObservers.get(root);
    if (!entry) continue;
    entry.hosts.delete(host);
    if (entry.hosts.size === 0) {
      entry.observer.disconnect();
      contextObservers.delete(root);
    }
  }
  roots.clear();
}

/** Register or extend one or more locale dictionaries. English remains the fallback. */
export function registerTranslation(...entries: FluidTranslation[]): void {
  for (const entry of entries) {
    const code = normalize(entry.$code);
    translations.set(code, { ...translations.get(code), ...entry, $code: code });
  }
  notify();
}

/** Remove a registered locale, primarily useful for tests and hot reload. */
export function unregisterTranslation(code: string): boolean {
  if (normalize(code) === "en") return false;
  const removed = translations.delete(normalize(code));
  if (removed) notify();
  return removed;
}

function languageFor(element: HTMLElement): string {
  const closest = contextAttribute(element, "lang");
  const ownerDocument =
    element.ownerDocument ?? (typeof document === "undefined" ? undefined : document);
  const documentLocale = ownerDocument?.documentElement?.lang;
  const browserLocale =
    ownerDocument?.defaultView?.navigator.language ??
    (typeof navigator === "undefined" ? "" : navigator.language);
  return normalize(closest || documentLocale || browserLocale || "en");
}

function localeFor(element: HTMLElement): string {
  const locale = languageFor(element);
  try {
    // HTML permits arbitrary `lang` values, while Intl formatters reject
    // malformed tags. Keep message and display formatting on the same safe
    // English fallback for invalid or test-runner-provided sentinel values.
    Intl.getCanonicalLocales(locale);
    return locale;
  } catch {
    return "en";
  }
}

function dictionaryFor(locale: string): FluidTranslation {
  return translations.get(locale) ?? translations.get(locale.split("-")[0]!) ?? english;
}

/** Reactive locale access shared by every Fluid component. */
export class LocalizationController implements ReactiveController {
  private observedRoots = new Set<Node>();

  constructor(private readonly host: ReactiveControllerHost & HTMLElement) {
    host.addController(this);
  }

  hostConnected(): void {
    hosts.add(this.host);
    releaseContext(this.host, this.observedRoots);
    this.observedRoots = observeContext(this.host);
    // A reconnect can change inherited context without changing any host property.
    this.host.requestUpdate();
  }

  hostDisconnected(): void {
    hosts.delete(this.host);
    releaseContext(this.host, this.observedRoots);
  }

  get locale(): string {
    return localeFor(this.host);
  }

  get dir(): "ltr" | "rtl" {
    const explicit = contextAttribute(this.host, "dir")?.toLowerCase();
    if (explicit === "rtl" || explicit === "ltr") return explicit;
    return dictionaryFor(languageFor(this.host)).$dir ?? "ltr";
  }

  term<K extends FluidTranslationTerm>(key: K, ...args: FluidTranslationArguments<K>): string {
    const local = dictionaryFor(languageFor(this.host))[key] ?? english[key];
    return typeof local === "function"
      ? (local as (...values: unknown[]) => string)(...args)
      : String(local);
  }

  /** Resolve a term for an explicit formatter locale without changing DOM language context. */
  termForLocale<K extends FluidTranslationTerm>(
    locale: string,
    key: K,
    ...args: FluidTranslationArguments<K>
  ): string {
    const local = dictionaryFor(normalize(locale))[key] ?? english[key];
    return typeof local === "function"
      ? (local as (...values: unknown[]) => string)(...args)
      : String(local);
  }
}
