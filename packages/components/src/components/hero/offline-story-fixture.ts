const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="0.5" stop-color="#db2777"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <radialGradient id="b" cx="0.25" cy="0.3" r="0.6">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c" cx="0.8" cy="0.75" r="0.55">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="675" fill="url(#a)"/>
  <rect width="900" height="675" fill="url(#b)"/>
  <rect width="900" height="675" fill="url(#c)"/>
  <path d="M0 470C180 380 320 540 520 460S780 320 900 380V675H0Z" fill="#0f172a" opacity="0.25"/>
</svg>`;

/** Story-only artwork with intrinsic dimensions and no external request. */
export const offlineGradientArtwork = `data:image/svg+xml,${encodeURIComponent(artwork)}`;
