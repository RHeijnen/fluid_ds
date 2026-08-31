/*
 * The closing-band gradient artwork. An original, dependency-free SVG (a
 * wider cut of the artwork used in the hero component's stories), inlined as
 * a data URI so the landing page ships no external image request.
 */
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="0.5" stop-color="#db2777"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <radialGradient id="b" cx="0.22" cy="0.25" r="0.65">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c" cx="0.85" cy="0.7" r="0.6">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="d" cx="0.55" cy="1" r="0.7">
      <stop offset="0" stop-color="#f472b6" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#f472b6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#a)"/>
  <rect width="1600" height="900" fill="url(#b)"/>
  <rect width="1600" height="900" fill="url(#c)"/>
  <rect width="1600" height="900" fill="url(#d)"/>
  <path d="M0 640c260-120 420 90 720 10s560-190 880-90v340H0Z" fill="#0f172a" opacity="0.22"/>
  <path d="M0 730c300-90 520 60 840-10s500-120 760-40v220H0Z" fill="#0f172a" opacity="0.18"/>
</svg>`;

export const gradientArtwork = `data:image/svg+xml,${encodeURIComponent(artwork)}`;
