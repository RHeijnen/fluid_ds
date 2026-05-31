/**
 * Default icon set. Lucide-style: 24×24 viewBox, currentColor strokes,
 * 2px stroke width, rounded caps. Bundled icons we know we need internally
 * (chevrons for selects, check for switches, eye toggles for password
 * inputs, etc).
 *
 * Each value is the *inner* SVG markup; the <fluid-icon> element wraps it
 * with the outer <svg> attributes so they stay consistent.
 */
const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const defaultIcons: Record<string, string> = {
  "chevron-down": wrap(`<path d="m6 9 6 6 6-6"/>`),
  "chevron-up": wrap(`<path d="m18 15-6-6-6 6"/>`),
  "chevron-right": wrap(`<path d="m9 18 6-6-6-6"/>`),
  "chevron-left": wrap(`<path d="m15 18-6-6 6-6"/>`),
  check: wrap(`<path d="M20 6 9 17l-5-5"/>`),
  close: wrap(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),
  copy: wrap(
    `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`
  ),
  download: wrap(
    `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`
  ),
  eye: wrap(
    `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`
  ),
  "eye-off": wrap(
    `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>`
  ),
  undo: wrap(
    `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`
  ),
  search: wrap(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`),
  "more-horizontal": wrap(
    `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`
  ),
  info: wrap(
    `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`
  ),
  "alert-triangle": wrap(
    `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`
  )
};
