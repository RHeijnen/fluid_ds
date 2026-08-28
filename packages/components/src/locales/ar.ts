import {
  registerTranslation,
  type FluidBinaryUnit,
  type FluidTranslationDictionary
} from "../internal/localization.js";

const binaryUnits: Record<FluidBinaryUnit, readonly [string, string, string, string]> = {
  bit: ["بت", "بتان", "بتات", "بت"],
  kibibit: ["كيبي بت", "كيبي بتان", "كيبي بتات", "كيبي بت"],
  mebibit: ["ميبي بت", "ميبي بتان", "ميبي بتات", "ميبي بت"],
  gibibit: ["جيبي بت", "جيبي بتان", "جيبي بتات", "جيبي بت"],
  tebibit: ["تيبي بت", "تيبي بتان", "تيبي بتات", "تيبي بت"],
  byte: ["بايت", "بايتان", "بايتات", "بايت"],
  kibibyte: ["كيبي بايت", "كيبي بايتان", "كيبي بايتات", "كيبي بايت"],
  mebibyte: ["ميبي بايت", "ميبي بايتان", "ميبي بايتات", "ميبي بايت"],
  gibibyte: ["جيبي بايت", "جيبي بايتان", "جيبي بايتات", "جيبي بايت"],
  tebibyte: ["تيبي بايت", "تيبي بايتان", "تيبي بايتات", "تيبي بايت"]
};

function binaryUnitIndex(category: Intl.LDMLPluralRule): 0 | 1 | 2 | 3 {
  if (category === "one") return 0;
  if (category === "two") return 1;
  if (category === "few") return 2;
  return 3;
}

export const ar = {
  $code: "ar",
  countdownComplete: "اكتمل العد التنازلي.",
  countdownRemaining: (duration: string) => `الوقت المتبقي: ${duration}.`,
  tourStep: (current: string, total: string) => `الخطوة ${current} من ${total}`,
  tourStepAnnouncement: (current: string, total: string, title: string, body: string) =>
    `الخطوة ${current} من ${total}. ${title}. ${body}`,
  skip: "تخطي",
  back: "السابق",
  next: "التالي",
  done: "تم",
  meter: "مقياس",
  meterValue: (value: string, maximum: string) => `${value} من ${maximum}`,
  meterValueWithBand: (
    value: string,
    maximum: string,
    band: "optimum" | "suboptimum" | "even-less-good"
  ) =>
    `${value} من ${maximum}، ${band === "optimum" ? "جيد" : band === "suboptimum" ? "مقبول" : "ضعيف"}`,
  binaryUnit: (
    pluralCategory: Intl.LDMLPluralRule,
    formattedValue: string,
    unit: FluidBinaryUnit
  ) => `${formattedValue} ${binaryUnits[unit][binaryUnitIndex(pluralCategory)]}`,
  notifications: "الإشعارات",
  $dir: "rtl",
  apply: "تطبيق",
  avatar: "صورة رمزية",
  avatarWithInitials: (initials: string) => `صورة رمزية: ${initials}`,
  breadcrumb: "مسار التنقل",
  cancel: "إلغاء",
  chooseDate: "اختيار تاريخ",
  chooseDateRange: "اختيار نطاق تاريخ",
  chooseTime: "اختيار وقت",
  chooseOrDropFiles: "انقر أو اسحب الملفات إلى هنا",
  closeDialog: "إغلاق مربع الحوار",
  closeDrawer: "إغلاق اللوحة",
  color: "اللون",
  colorPresets: "ألوان معدة مسبقًا",
  commandPalette: "لوحة الأوامر",
  commandPlaceholder: "اكتب أمرًا أو ابحث…",
  comparisonSlider: "شريط تمرير المقارنة",
  contextMenu: "قائمة السياق",
  copied: "تم النسخ",
  copyToClipboard: "نسخ إلى الحافظة",
  decrease: "تقليل",
  days: "أيام",
  dismiss: "إغلاق",
  invalidHexColor: "أدخل لونًا سداسيًا عشريًا صالحًا (مثل #ff00aa).",
  chooseColorRequired: "يرجى اختيار لون.",
  completeField: "يرجى إكمال هذا الحقل.",
  selectFileRequired: "يرجى اختيار ملف.",
  chooseDateRequired: "يرجى اختيار تاريخ.",
  chooseDateRangeRequired: "يرجى اختيار نطاق تواريخ.",
  chooseTimeRequired: "يرجى اختيار وقت.",
  chooseAppointmentRequired: "يرجى اختيار موعد.",
  appointmentUnavailable: "الموعد المحدد غير متاح.",
  multipleFilesHint: "يمكن اختيار عدة ملفات",
  singleFileHint: "ملف واحد في كل مرة",
  onThisPage: "في هذه الصفحة",
  openMenu: "فتح القائمة",
  alert: "تنبيه",
  notification: "إشعار",
  copyCode: "نسخ الشفرة",
  areYouSure: "هل تريد المتابعة؟",
  confirm: "تأكيد",
  minimum: "الحد الأدنى",
  maximum: "الحد الأقصى",
  actions: "إجراءات",
  resizePanels: "تغيير حجم اللوحات",
  remove: "إزالة",
  available: "المتاح",
  selected: "المحدد",
  pricingPlans: "خطط الأسعار",
  mostPopular: "الأكثر شيوعًا",
  clear: "مسح",
  undo: "تراجع",
  upload: "رفع",
  fit: "ملاءمة",
  copyLanguageCode: (language: string) => `نسخ شفرة ${language}`,
  dropFilesOrBrowse: "اسحب الملفات إلى هنا أو انقر لتصفحها",
  fileInput: "اختيار ملف",
  fillOutField: "يرجى ملء هذا الحقل.",
  checkThisBox: "يرجى تحديد هذا المربع.",
  toggleThisSwitch: "يرجى تفعيل هذا المفتاح.",
  pickAnOption: "يرجى اختيار أحد الخيارات.",
  completeCode: "يرجى إكمال الرمز.",
  showMore: "عرض المزيد",
  showLess: "عرض أقل",
  hoursShort: "س",
  increase: "زيادة",
  loading: "جارٍ التحميل",
  menu: "القائمة",
  minutesShort: "د",
  navigation: "التنقل",
  noMatches: "لا توجد مطابقات",
  noMatchingTimes: "لا توجد أوقات مطابقة",
  selectDayAvailableTimes: "اختر يوماً لعرض الأوقات المتاحة.",
  loadingAvailability: "جارٍ تحميل الأوقات المتاحة",
  timeSlots: "الفترات الزمنية",
  timeSlotsFor: (date: string) => `الفترات الزمنية ليوم ${date}`,
  noOpeningsOnDay: "لا توجد أوقات متاحة في هذا اليوم.",
  selectDayToSeeOpenings: "اختر يوماً لعرض الأوقات المتاحة.",
  slotUnavailable: (label: string) => `${label}، غير متاح`,
  openingsAvailable: (count: number, date: string) =>
    `${count} ${count === 1 ? "موعد متاح" : "مواعيد متاحة"}${date ? ` في ${date}` : ""}.`,
  nextMonth: "الشهر التالي",
  nextPage: "الصفحة التالية",
  nextSlide: "الشريحة التالية",
  noResults: "لم يتم العثور على نتائج.",
  oneTimeCode: "رمز لمرة واحدة",
  pagination: "ترقيم الصفحات",
  popover: "نافذة منبثقة",
  page: (page: number) => `الصفحة ${page}`,
  previousMonth: "الشهر السابق",
  previousPage: "الصفحة السابقة",
  previousSlide: "الشريحة السابقة",
  progress: "التقدم",
  rangePresets: "نطاقات معدة مسبقًا",
  selectRange: "اختر نطاقًا",
  presetToday: "اليوم",
  presetYesterday: "أمس",
  presetLast7Days: "آخر 7 أيام",
  presetLast30Days: "آخر 30 يومًا",
  presetThisMonth: "هذا الشهر",
  presetLastMonth: "الشهر الماضي",
  rating: "التقييم",
  required: "مطلوب",
  showPassword: "إظهار كلمة المرور",
  hidePassword: "إخفاء كلمة المرور",
  secondsShort: "ث",
  select: "اختيار…",
  selectDate: "اختر تاريخًا",
  selectDateRange: "اختر نطاق تاريخ",
  selectTime: "اختر وقتًا",
  signHere: "وقّع هنا",
  signature: "التوقيع",
  sidebar: "الشريط الجانبي",
  slideOf: (slide: number, total: number) => `الشريحة ${slide} من ${total}`,
  slides: "الشرائح",
  timeOptions: "خيارات الوقت",
  timeRemaining: "الوقت المتبقي",
  toggleDarkMode: "تبديل الوضع الداكن",
  cycleBrand: "تبديل العلامة التجارية",
  cycleBrandCurrent: (brand: string) => `تبديل العلامة التجارية، الحالية ${brand}`,
  digitOf: (digit: number, length: number) => `الرقم ${digit} من ${length}`,
  goToSlide: (slide: number) => `الانتقال إلى الشريحة ${slide}`,
  hexColor: (label: string) => `${label}، قيمة سداسية`,
  openColorPicker: (label: string) => `${label}، فتح منتقي الألوان`,
  moveSelectedTo: (label: string) => `نقل التحديد إلى ${label}`,
  removeFile: (name: string) => `إزالة ${name}`,
  playAnimation: "تشغيل الحركة",
  pauseAnimation: "إيقاف الحركة مؤقتًا",
  audioPlayer: "مشغل صوت",
  playMedia: "تشغيل",
  pauseMedia: "إيقاف مؤقت",
  seekMedia: "موضع التشغيل",
  playbackPosition: (current: string, total: string) => `${current} من ${total}`,
  muteMedia: "كتم الصوت",
  unmuteMedia: "إلغاء كتم الصوت",
  video: "فيديو",
  playlist: "قائمة التشغيل",
  trackNumber: (number: string) => `المقطع ${number}`,
  imagePosition: (current: string, total: string) => `الصورة ${current} من ${total}`,
  imageViewer: "عارض الصور",
  previousImage: "الصورة السابقة",
  nextImage: "الصورة التالية",
  closeViewer: "إغلاق",
  positionOf: (current: string, total: string) => `${current} من ${total}`,
  zoomIn: "تكبير",
  zoomOut: "تصغير",
  resetZoom: "إعادة ضبط التكبير",
  panLeft: "تحريك إلى اليسار",
  panRight: "تحريك إلى اليمين",
  panUp: "تحريك إلى الأعلى",
  panDown: "تحريك إلى الأسفل",
  eventsOnDate: (count: number, formattedCount: string, date: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    const events =
      category === "zero"
        ? "لا أحداث"
        : category === "one"
          ? "حدث واحد"
          : category === "two"
            ? "حدثان"
            : `${formattedCount} ${category === "few" ? "أحداث" : "حدثًا"}`;
    return `${date}، ${events}`;
  },
  showAllEvents: (count: number, formattedCount: string, date: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    const events =
      category === "one"
        ? "الحدث"
        : category === "two"
          ? "الحدثين"
          : `${formattedCount} ${category === "few" ? "أحداث" : "حدثًا"}`;
    return `عرض كل ${events} في ${date}`;
  },
  moreEvents: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    return `+${formattedCount} ${category === "one" ? "إضافي" : category === "two" ? "إضافيان" : "إضافية"}`;
  },
  slotRules: "قواعد الفترات",
  slotLengthMinutes: "مدة الفترة (بالدقائق)",
  capacityPerSlot: "السعة لكل فترة",
  minimumNoticeHours: "الحد الأدنى للإشعار (بالساعات)",
  bookUpToDays: "الحجز حتى (بالأيام)",
  weeklyHours: "ساعات العمل الأسبوعية",
  openOnDay: (day: string) => `مفتوح يوم ${day}`,
  openingTime: (day: string, position: string) => `وقت الفتح ${position} ليوم ${day}`,
  closingTime: (day: string, position: string) => `وقت الإغلاق ${position} ليوم ${day}`,
  removeTimeWindow: (day: string, position: string) => `إزالة الفترة ${position} ليوم ${day}`,
  openingBeforeClosing: "يجب أن يسبق وقت الفتح وقت الإغلاق.",
  addHours: "إضافة ساعات",
  closed: "مغلق",
  closedDates: "تواريخ الإغلاق",
  closedDate: "تاريخ الإغلاق",
  closedAllDay: "مغلق طوال اليوم",
  removeClosedDate: "إزالة تاريخ الإغلاق",
  addClosedDate: "إضافة تاريخ إغلاق",
  richTextEditor: "محرر نص منسق",
  editorFormatting: "التنسيق",
  editorBold: "عريض",
  editorItalic: "مائل",
  editorUnderline: "تحته خط",
  editorBulletList: "قائمة نقطية",
  editorNumberedList: "قائمة مرقمة",
  editorLink: "رابط",
  editorClearFormatting: "مسح التنسيق",
  editorLinkUrl: "عنوان URL للرابط",
  kanbanMoveUp: "تحريك لأعلى",
  kanbanMoveDown: "تحريك لأسفل",
  kanbanMovePreviousColumn: "تحريك إلى العمود السابق",
  kanbanMoveNextColumn: "تحريك إلى العمود التالي",
  kanbanMoveAction: (action: string, card: string) => `${action}: ${card}`,
  kanbanMovedCard: (card: string, column: string, position: string, total: string) =>
    `تم نقل ${card} إلى ${column}، الموضع ${position} من ${total}.`,
  kanbanDroppedIn: (column: string) => `تم الإفلات في ${column}.`,
  kanbanDropped: "تم الإفلات.",
  kanbanPickedUpIn: (column: string) =>
    `تم الالتقاط. استخدم مفاتيح الأسهم للتحريك، ومفتاح المسافة للإفلات، وEscape للإلغاء. في ${column}.`,
  kanbanPickedUp: "تم الالتقاط.",
  kanbanMoveCancelled: "تم إلغاء النقل.",
  kanbanDraggableCard: "بطاقة قابلة للسحب",
  kanbanBoard: "لوحة كانبان",
  nodeGraph: "رسم بياني للعقد",
  nodeGraphEditorRole: "محرر رسم بياني للعقد",
  nodeGraphNodeMoved: (node: string, x: string, y: string) => `تم نقل ${node} إلى ${x}، ${y}`,
  nodeGraphNodeRemoved: (node: string) => `تمت إزالة ${node}`,
  nodeGraphNodeSelected: (node: string) => `تم تحديد ${node}`,
  nodeGraphEdgeSelected: (from: string, to: string) =>
    `تم تحديد الاتصال من ${from} إلى ${to}. اضغط Delete لإزالته.`,
  nodeGraphEdgeRemoved: (from: string, to: string) => `تمت إزالة الاتصال من ${from} إلى ${to}`,
  nodeGraphConnectStart: (node: string, port: string) =>
    `جارٍ الاتصال من ${node}، ${port}. استخدم مفاتيح الأسهم لاختيار هدف، وEnter للاتصال، وEscape للإلغاء.`,
  nodeGraphConnectCandidate: (node: string, index: string, count: string) =>
    `${node}، ${index} من ${count}`,
  nodeGraphConnected: (from: string, to: string) => `تم توصيل ${from} بـ ${to}`,
  nodeGraphConnectCancelled: "تم إلغاء الاتصال",
  nodeGraphConnectFailed: "تعذر الاتصال",
  nodeGraphConnectNoTargets: "لا توجد أهداف متاحة للاتصال بها",
  nodeGraphZoomChanged: (percent: string) => `التكبير ${percent} بالمئة`,
  nodeGraphInputPort: (node: string) => `مدخل ${node}`,
  nodeGraphOutputPort: (port: string, node: string) => `${port}، مخرج ${node}`,
  nodeGraphNodeRole: "عقدة",
  nodeGraphNodeCount: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    return category === "zero"
      ? "لا عقد"
      : category === "one"
        ? "عقدة واحدة"
        : category === "two"
          ? "عقدتان"
          : `${formattedCount} ${category === "few" ? "عقد" : "عقدة"}`;
  },
  nodeGraphEdgeCount: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    return category === "zero"
      ? "لا اتصالات"
      : category === "one"
        ? "اتصال واحد"
        : category === "two"
          ? "اتصالان"
          : `${formattedCount} ${category === "few" ? "اتصالات" : "اتصالًا"}`;
  },
  chart: "مخطط",
  chartTotal: "الإجمالي",
  chartLegendItem: (chart: string, position: string) => `${chart} ${position}`,
  map: "خريطة",
  markdownLoadFailed: (detail: string) => `تعذر تحميل Markdown: ${detail}`,
  qrCodeFor: (value: string) => `رمز استجابة سريعة لـ ${value}`,
  emptyQrCode: "رمز استجابة سريعة فارغ",
  parserRequiredTitle: "مطلوب",
  parserSelectColumn: "اختر عمودًا…",
  parserNotMapped: "(غير معيّن)",
  parserDropFile: "أفلت ملف CSV أو JSON أو Excel هنا، أو انقر للاستعراض",
  parserInvalidJsonSyntax: (reason: string) => `JSON غير صالح: ${reason}`,
  parserInvalidJsonShape: "يجب أن يكون JSON مصفوفة كائنات أو كائنًا يحتوي على مصفوفة rows/data.",
  parserCouldNotParseFile: "تعذرت معالجة الملف.",
  parserCouldNotReadFile: (filename: string) =>
    filename ? `تعذرت قراءة ${filename}` : "تعذرت قراءة الملف",
  parserFieldRequired: (label: string) => `${label} مطلوب`,
  parserStringTooShort: (label: string, minimum: string) =>
    `يجب ألا يقل ${label} عن ${minimum} أحرف`,
  parserStringTooLong: (label: string, maximum: string) =>
    `يجب ألا يتجاوز ${label} ${maximum} أحرف`,
  parserPatternMismatch: (label: string) => `${label} لا يطابق التنسيق المطلوب`,
  parserInvalidNumber: (label: string, value: string) => `${label} ليس رقمًا: «${value}»`,
  parserInvalidInteger: (label: string, value: string) =>
    `يجب أن يكون ${label} عددًا صحيحًا: «${value}»`,
  parserNumberBelowMinimum: (label: string, minimum: string) => `يجب أن يكون ${label} ≥ ${minimum}`,
  parserNumberAboveMaximum: (label: string, maximum: string) => `يجب أن يكون ${label} ≤ ${maximum}`,
  parserInvalidBoolean: (label: string, value: string) =>
    `${label} ليس قيمة منطقية معروفة: «${value}»`,
  parserInvalidDate: (label: string, value: string) => `${label} ليس تاريخًا صالحًا: «${value}»`,
  parserDateBeforeMinimum: (label: string) => `${label} يسبق النطاق المسموح`,
  parserDateAfterMaximum: (label: string) => `${label} يتجاوز النطاق المسموح`,
  parserInvalidEmail: (label: string, value: string) =>
    `${label} ليس عنوان بريد إلكتروني صالحًا: «${value}»`,
  parserInvalidUrl: (label: string, value: string) => `${label} ليس عنوان URL صالحًا: «${value}»`,
  parserInvalidEnum: (label: string, options: string) =>
    `يجب أن يكون ${label} أحد هذه القيم: ${options}`,
  parserInvalidJson: (label: string) => `${label} ليس JSON صالحًا`,
  parserUnmappedRequired: (label: string) => `${label} مطلوب لكنه غير معيّن`,
  parserTransformFailed: (label: string, reason: string) => `فشل تحويل ${label}: ${reason}`,
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
    const totalCategory = new Intl.PluralRules("ar").select(total);
    const rows = totalCategory === "one" ? "صف" : totalCategory === "two" ? "صفين" : "صفوف";
    const parts = [`${keptDisplay} من ${totalDisplay} ${rows} جاهزة`];
    if (duplicates > 0)
      parts.push(`تمت إزالة ${duplicatesDisplay} ${duplicates === 1 ? "قيمة مكررة" : "قيم مكررة"}`);
    if (truncated > 0) parts.push(`${truncatedDisplay} فوق حد الصفوف`);
    return parts.join("، ");
  },
  parserCellErrorsFound: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    if (category === "one") return "تم العثور على خطأ خلية واحد";
    if (category === "two") return "تم العثور على خطأي خلية";
    return `تم العثور على ${formattedCount} أخطاء خلايا`;
  },
  parserAllRowsValid: "كل الصفوف صالحة",
  parserPreviewCaption: (
    shown: number,
    shownDisplay: string,
    total: number,
    totalDisplay: string
  ) =>
    `معاينة ${shownDisplay}${total > shown ? ` من ${totalDisplay}` : ""} ${shown === 1 ? "صف منقح" : "صفوف منقحة"}. فشل التحقق من الخلايا المميزة.`,
  parserMapColumns: "تعيين الأعمدة",
  parserPreview: "معاينة",
  parserImportRows: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    if (category === "one") return "استيراد صف واحد";
    if (category === "two") return "استيراد صفين";
    return `استيراد ${formattedCount} صفوف`;
  },
  parserDownloadFormat: (format: string) => `تنزيل ${format}`,
  parserReset: "إعادة ضبط",
  selectAllRows: "تحديد كل الصفوف",
  selectTableRow: (position: string) => `تحديد الصف ${position}`,
  tableResizeColumn: (column: string) => `تغيير حجم ${column}`,
  tableReorderColumn: (column: string) => `إعادة ترتيب ${column}`,
  tableColumnPosition: (column: string, position: string, count: string) =>
    `${column}، العمود ${position} من ${count}`,
  tableColumns: "أعمدة الجدول",
  closeColumnSettings: "إغلاق إعدادات الأعمدة",
  moveColumnEarlier: (column: string) => `نقل ${column} نحو البداية`,
  moveColumnLater: (column: string) => `نقل ${column} نحو النهاية`,
  columns: "الأعمدة",
  tableResults: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    return category === "zero"
      ? "لا نتائج"
      : category === "one"
        ? "نتيجة واحدة"
        : category === "two"
          ? "نتيجتان"
          : `${formattedCount} ${category === "few" ? "نتائج" : "نتيجة"}`;
  },
  tableLoadedResults: (count: number, formattedCount: string) => {
    const category = new Intl.PluralRules("ar").select(count);
    return category === "one"
      ? "تم تحميل نتيجة واحدة"
      : category === "two"
        ? "تم تحميل نتيجتين"
        : `تم تحميل ${formattedCount} ${category === "few" ? "نتائج" : "نتيجة"}`;
  },
  tableLoadedOf: (_loadedCount: number, loaded: string, total: string) =>
    `تم تحميل ${loaded} من ${total}`,
  tableLoadedMatchingTotal: (_loadedCount: number, loaded: string, available: string) =>
    `تم تحميل ${loaded} مطابقة · ${available} إجمالًا`,
  tableLoadedOfMatchingTotal: (
    _loadedCount: number,
    loaded: string,
    total: string,
    available: string
  ) => `تم تحميل ${loaded} من ${total} مطابقة · ${available} إجمالًا`,
  tableNoResults: "لا توجد نتائج",
  loadingMoreResults: "جارٍ تحميل المزيد من النتائج",
  scrollToLoadMore: "مرر لتحميل المزيد",
  allResultsLoaded: "تم تحميل كل النتائج"
} satisfies FluidTranslationDictionary;

registerTranslation(ar);
export default ar;
